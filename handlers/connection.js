const mongoose = require('mongoose');
const { Redis } = require('ioredis')
const { log } = require('my-utils');
const fs = require('node:fs')
const path = require('node:path')


module.exports = {
    run: async (server) => {
        const { mongooseURI, databases } = server.config

        databases.forEach(async (database) => {
            try {
                const [dbName, port] = database.split(':')
                const uri = `${mongooseURI}/${dbName}`

                log('DATABASE', `&aInitializing &d${dbName}`)

                /**
                 * @returns {Promise<mongoose.Connection>}
                 */
                function connectToMongoDB() {
                    return new Promise((resolve, reject) => {
                        const start = Date.now()

                        const connection = mongoose.createConnection(uri);

                        connection.on('connected', () => {
                            log('MongoDB', `&aConnected to database &d${dbName} &f[&b${Date.now() - start}ms&f]`)
                            resolve(connection);
                        });

                        connection.on('error', (err) => {
                            log('MongoDB', `&cConnection error!`)
                            console.error(err);
                            reject(err);
                        });
                    });
                }

                /**
                 * @returns {Promise<Redis>}
                 */
                function connectToRedis() {
                    return new Promise((resolve, reject) => {
                        const start = Date.now()

                        console.log('1')

                        const redisPort = parseInt(port) || 6380
                        const redis = new Redis(redisPort, {
                            host: 'redis-server'

                        })

                        redis.on('connected', () => {
                            const portLabbel = `&d${redisPort}${redisPort === 6380 ? ' &8(default)' : ''}`
                            log('Redis', `&aConnected to port ${portLabbel} &f[&b${Date.now() - start}ms&f]`)
                            resolve(redis);
                        });

                        redis.on('error', (err) => {
                            log('Redis', `&cConnection error!`)
                            console.error(err);
                            reject(err);
                        });
                    });
                }

                const [mongo, redis] = await Promise.all([connectToMongoDB(), connectToRedis()])

                const modelsPath = path.join(__dirname, `../models/${dbName}`)
                const models = {}

                if (fs.existsSync(modelsPath)) {

                    models = fs.readdirSync(modelsPath)
                        .filter(f => f.endsWith('.js'))
                        .map(file => {
                            try {
                                const model = require(`${modelsPath}/${file}`).initialize(server)

                                models[model.modelName] = model
                                log('MODELS', `&aInintialized &b${model.modelName}`)
                            } catch (e) {
                                log('MODELS', `&cCan not inintialize &b${file}`)
                                console.error(e)
                            }
                        })

                } else log('MODELS', `&cNo model was found !`)

                server.databases[dbName] = { mongo, redis, models }

                console.log('-'.repeat(50))

            } catch (e) {
                log('DATABASE', `&cInitialize failed !`)
                console.error(e)
            }
        })
    }
} 
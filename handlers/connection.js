const mongoose = require('mongoose');
const { Redis } = require('ioredis')
const { log } = require('my-utils');
const fs = require('node:fs')
const path = require('node:path')


module.exports = {
    run: async (server) => {
        const { mongooseURI, databases, redisPort } = server.config

        function connectToRedis() {
            return new Promise((resolve, reject) => {
                const start = Date.now()

                const redis = new Redis({
                    host: '84.247.139.12',
                    port: redisPort
                });

                redis.on('ready', () => {
                    log('Redis', `&aConnected to port &d${redis.options.port} &f[&b${Date.now() - start}ms&f]`)
                    resolve(redis);
                });

                redis.on('error', (err) => {
                    log('Redis', `&cConnection error!`)
                    console.error(err);
                    reject(err);
                });
            });
        }

        server.redis = await connectToRedis();

        for (const dbName of databases) {
            try {
                const uri = `${mongooseURI}/${dbName}`

                console.log('-'.repeat(50))

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

                const mongo = await connectToMongoDB()

                const modelsPath = path.join(__dirname, `../models/${dbName}`)
                const models = {}

                if (fs.existsSync(modelsPath))
                    fs.readdirSync(modelsPath).filter(f => f.endsWith('.js'))
                        .map(file => {
                            try {
                                const model = require(`${modelsPath}/${file}`).initialize(mongo)

                                models[model.modelName] = model
                                log('MODELS', `&aInintialized &b${model.modelName}`)
                            } catch (e) {
                                log('MODELS', `&cCan not inintialize &b${file}`)
                                console.error(e)
                            }
                        })
                else log('MODELS', `&cNo model was found !`)

                server.databases[dbName] = { mongoose: mongo, models }

                console.log('')
            } catch (e) {
                log('DATABASE', `&cInitialize failed !`)
                console.error(e)
            }
        }

    }
} 
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

                const redis = new Redis(redisPort);

                redis.on('connected', () => {
                    log('Redis', `&aConnected to port &d${redisPort} &f[&b${Date.now() - start}ms&f]`)
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

        const promises = databases.map(async (dbName) => {
            try {
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

                const mongoose = await connectToMongoDB()

                const modelsPath = path.join(__dirname, `../models/${dbName}`)
                const models = {}

                const modelFiles = fs.readdirSync(modelsPath, { recursive: true })

                if (modelFiles && modelFiles?.length) {
                    modelFiles.filter(f => f.endsWith('.js'))
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

                server.databases[dbName] = { mongoose, models }

                console.log()
            } catch (e) {
                log('DATABASE', `&cInitialize failed !`)
                console.error(e)
            }
        })

        await Promise.all(promises)
    }
} 
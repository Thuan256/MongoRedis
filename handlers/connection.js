const mongoose = require('mongoose');
const { Redis } = require('ioredis')
const { NodeSSH } = require('node-ssh');

const fs = require('node:fs')
const path = require('node:path');

const { log } = require('my-utils');

module.exports = {
    run: async (server) => {

        const { mongooseURI, databases, ssh } = server.config
        let SSH

        try {
            const start = Date.now()
            SSH = await new NodeSSH().connect(ssh)
            log('SSH', `&aConnected to &d${ssh.host} &f[&b${Date.now() - start}ms&f]`)

        } catch (e) {
            log('SSH', `&cConnection error`)
            throw new Error(e.message)
        }

        for (const database of databases) {
            try {

                let [dbName, port] = database.split(':')
                port ??= 6380

                const uri = `${mongooseURI}/${dbName}`

                console.log('-'.repeat(50))

                //start redis-server
                const s = Date.now()
                const commandResult = await SSH.execCommand(`redis-server --port ${port} --bind 0.0.0.0 --protected-mode no --daemonize yes`)
                if (commandResult.code === 0) {
                    log('SSH', `&aStarted &bredis-server &aon port &d${port} &f[&b${Date.now() - s}ms&f]`)
                } else {
                    log('SSH', `&cFailed to start &bredis-server`)
                    throw new Error(commandResult.stderr)
                }

                //connect to redis
                /**
                 * @returns {Promise<Redis>}
                 */
                function connectToRedis() {
                    return new Promise((resolve, reject) => {
                        const start = Date.now()

                        const redis = new Redis(port, { host: ssh.host });

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

                const [mongo, redis] = await Promise.all([connectToMongoDB(), connectToRedis()])

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

                server.databases[dbName] = { mongo, redis, models }

                console.log('')
            } catch (e) {
                log('DATABASE', `&cInitialize failed !`)
                console.error(e)
            }
        }

    }
} 
const mongoose = require('mongoose');
const { Redis } = require('ioredis')
const { NodeSSH } = require('node-ssh');

const fs = require('node:fs')
const path = require('node:path');

const { log } = require('my-utils');

module.exports = {
    /**
     * @param {import('my-classes').Server}
     */
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
                console.log('-'.repeat(50))

                let [dbName, port] = database.split(':')
                port ??= 6380
                let models = [];
                const dbs = {};

                const uri = `${mongooseURI}/${dbName}`;

                //initialize dbSize
                const modelsPath = path.join(__dirname, `../models/${dbName}`)
                if (fs.existsSync(modelsPath)) models = fs.readdirSync(modelsPath).filter(f => f.endsWith('.js'))
                const dbSize = models.length

                //start redis-server
                const s = Date.now()
                const commandResult = await SSH.execCommand(`redis-server --port ${port} --bind 0.0.0.0 --protected-mode no --daemonize yes --databases ${dbSize}`)
                if (commandResult.code === 0) {
                    log('SSH', `&aStarted &eredis-server &f{ port: &d${port}&f, databases: &d${dbSize} &f} &f[&b${Date.now() - s}ms&f]`)
                } else {
                    log('SSH', `&cFailed to start &bredis-server`)
                    throw new Error(commandResult.stderr)
                }

                //connect to mongodb
                const mongo = await (
                    /**
                     * @returns {Promise<mongoose.Connection>}
                     */
                    async () => {
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
                    })()

                //intitalize databases
                if (dbSize) {
                    const promises = models.map(async (file, index) => {
                        const md = require(`${modelsPath}/${file}`)
                        const model = md.initialize(mongo)
                        const key = md.key

                        const { modelName } = model

                        //connect to redis
                        const redis = await (
                            /**
                             * @returns {Promise<Redis>}
                             */
                            async () => {
                                return new Promise((resolve, reject) => {

                                    const redis = new Redis({
                                        host: ssh.host,
                                        port: port,
                                        db: index
                                    });

                                    redis.on('ready', () => resolve(redis));
                                    redis.on('error', (err) => reject(err));

                                    // log('Redis', `&aConnected to port &d${redis.options.port} &f[&b${Date.now() - start}ms&f]`)
                                    // log('Redis', `&cConnection error!`)
                                });
                            })()

                        dbs[modelName] = { key, model, redis }
                        log('DATABASE', `&aInintialized &e${modelName} &f- &d${redis.options.db}`)
                    })

                    await Promise.all(promises)
                } else log('DATABASE', `&cNo model was found !`)

                server.databases[dbName] = { mongo, dbs }
            } catch (e) {
                log('DATABASE', `&cInitialize failed !`)
                console.error(e)
            }
        }

    }
} 
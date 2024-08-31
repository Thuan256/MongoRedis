const express = require('express');
const { log } = require('my-utils')
const fs = require('node:fs')

module.exports = {
    /**
     * @param {import('../classes/Server')} server
     */
    run: async (server) => {

        const app = express();
        app.use(express.json());

        fs.readdirSync('./express')
            .filter(f => f.endsWith('.js'))
            .forEach(file => {
                const { method, path, run } = require(`../express/${file}`)
                app[method](path, async (req, res) => await run(req, res, server))
            })

        app.get('get/:dbName/:modelName/:query', async (req, res) => {

        });

        app.post('set/:dbName/:modelName/:query', async (req, res) => {
            const { dbName, modelName, query } = req.params;
            const data = req.body;

            const db = server.databases[dbName]

            if (db) {
                const { redis, model, key } = db.dbs[modelName];
                const dbPath = `&d${dbName}&f/&d${modelName}`

                if (!model) {
                    log('DATABASE', `&cModel ${dbPath} &cdoesn't exist !`)
                    res.status(404).json({ error_code: 'NO_MODEL' })
                } else if (!redis) {
                    log('DATABASE', `&cRedis ${dbPath} &cdoesn't exist !`)
                    res.status(404).json({ error_code: 'NO_REDIS' })
                } else {
                    try {
                        const s = Date.now()

                        const dataPath = `${dbPath}&f/&d${key}:${query}`

                        await redis.set(query, data)
                        await model.findOneAndUpdate({ [key]: query }, data)

                        res.send(data)

                        log('DATABASE', `&aUpdated ${dataPath} &f[&b${Date.now() - s}ms&f]`)
                    } catch (e) {
                        log('DATABASE', `&cUpdate ${dataPath} &cfailed`)
                        res.status(500).json({ error_code: 'UPDATE_ERROR' })
                        console.error(e)
                    }
                }
            } else {
                log('DATABASE', `&cCan not find database &d${dbName}`)
                res.status(404).json({ error_code: 'NO_DATABASE' })
            }
        })

        await (async () => {
            return new Promise((resolve, reject) => {
                app.listen(3000, () => {
                    resolve(log('Express', '&aListening on port &d3000'))
                })
            })
        })()
    }
}
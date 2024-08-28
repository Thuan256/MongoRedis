const express = require('express');
const { log } = require('my-utils')

module.exports = {
    run: async (server) => {

        const app = express();
        app.use(express.json());

        app.get('get/:dbName/:modelName/:query', async (req, res) => {
            const { dbName, modelName, query } = req.params;

            const db = server.databases[dbName]

            if (db) {
                const { redis } = db.dbs[modelName];

                if (!redis) {
                    log('DATABASE', `&cRedis &d${dbName}&f/&d${modelName} &cdoesn't exist !`)
                    res.status(404).json({ error_code: 'NO_REDIS' })
                } else {
                    const data = await redis.get(query)
                    res.send(data)
                }

            } else {
                log('DATABASE', `&cCan not find database &d${dbName}`)
                res.status(404).json({ error_code: 'NO_DATABASE' })
            }
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
        app.listen(3000, () => console.log('Server running on port 3000'));

    }
}
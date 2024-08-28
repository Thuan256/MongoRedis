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

                if (!model) {
                    log('DATABASE', `&cModel &d${dbName}&f/&d${modelName} &cdoesn't exist !`)
                    res.status(404).json({ error_code: 'NO_MODEL' })
                } else if (!redis) {
                    log('DATABASE', `&cRedis &d${dbName}&f/&d${modelName} &cdoesn't exist !`)
                    res.status(404).json({ error_code: 'NO_REDIS' })
                } else {
                    const data = await redis.set(query, data)
                }

            } else {
                log('DATABASE', `&cCan not find database &d${dbName}`)
                res.status(404).json({ error_code: 'NO_DATABASE' })
            }
        })

        app.post('/:dbName/:modelName/:id', async (req, res) => {
            const { dbName, modelName, id } = req.params;
            const data = req.body;

            const { redis, models } = server.databases[dbName]
            const model = models[modelName]

            if (redis) {
                try {
                    await redis.set(`${modelName}:${id}`, data)
                    res.send(data)
                } catch (e) {
                    res.status(500).json({ error_code: 'REDIS_SERVER_ERROR' })
                }
            } else res.status(404).json({ error_code: 'NO_REDIS_SERVER' })

            if (model) {
                await model.findOneAndUpdate({ id: id }, data)
            }

        });
        app.listen(3000, () => console.log('Server running on port 3000'));

    }
}
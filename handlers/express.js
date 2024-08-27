const express = require('express');

module.exports = {
    run: async (server) => {

        const app = express();
        app.use(express.json());

        app.get('/:dbName/:modelName/:s_key/:s_value', async (req, res) => {
            const { dbName, modelName, s_key, s_value } = req.params;

            const redis = server.databases[dbName]?.redis

            if (redis) {
                try {

                    

                    const data = await redis.get(`${modelName}:${id}`)
                    res.send(data)
                } catch (e) {
                    res.status(500).json({ error_code: 'REDIS_SERVER_ERROR' })
                }
            } else res.status(404).json({ error_code: 'NO_REDIS_SERVER' })
        });

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
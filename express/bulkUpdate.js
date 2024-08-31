module.exports = {
    method: 'set',
    path: 'bulkUpdate/:dbName/:modelName',
    /**
     * 
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     * @param {import('my-classes').Server} server 
     */
    run: async (req, res, server) => {
        const { dbName, modelName } = req.params
        const { data } = req.body

        if (!Array.isArray(data)) {
            server.utils.log('REQUEST', `&cInvalid data type! Received &d${typeof data}`)
            res.status(400).json({ error_code: 'INVALID_DATA' })
        }

        const db = server.databases[dbName]

        if (db) {
            const { redis, model, key } = db.dbs[modelName]
            const dbPath = `&d${dbName}&f/&d${modelName}`

            if (!model) {
                server.utils.log('DATABASE', `&cModel ${dbPath} &cdoesn't exist !`)
                res.status(404).json({ error_code: 'NO_MODEL' })
            } else if (!redis) {
                server.utils.log('DATABASE', `&cRedis ${dbPath} &cdoesn't exist !`)
                res.status(404).json({ error_code: 'NO_REDIS' })
            } else {
                const s = Date.now()

                const { batchSize } = server.config.redis
                const bulkOps = [];
                const redisCommands = [];

                data.forEach(([query, updateData]) => {
                    bulkOps.push({
                        updateOne: {
                            filter: { [key]: query },
                            update: { $set: updateData },
                            upsert: true
                        }
                    });

                    const redisValue = JSON.stringify(updateData);
                    redisCommands.push(['set', query, redisValue]);
                });

                try {
                    const mongoResult = model.bulkWrite(mongoOperations)
                    const redisResults = (async () => {
                        const results = [];
                        for (let i = 0; i < redisCommands.length; i += batchSize) {
                            const batch = redisCommands.slice(i, i + batchSize);
                            const batchResults = await redis.pipeline(batch).exec();
                            results.push(...batchResults);
                        }
                        return results;
                    })()

                    await Promise.all([mongoResult, redisResults])
                    res.json({ mongo: mongoResult, redis: redisResults });

                    server.utils.log('DATABASE', `&aBulk-Updated &d${data.length} &aat ${dbPath} &f[&b${Date.now() - s}ms&f]`)
                } catch (e) {
                    server.utils.log('DATABASE', `&cBulk-Update ${dbPath} &cfailed`)
                    res.status(500).json({ error_code: 'UPDATE_ERROR' })
                    console.error(e)
                }
            }
        } else {
            server.utils.log('DATABASE', `&cCan not find database &d${dbName}`)
            res.status(404).json({ error_code: 'NO_DATABASE' })
        }
    }
}
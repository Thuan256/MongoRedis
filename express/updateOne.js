module.exports = {
    method: 'set',
    path: 'updateOne/:dbName/:modelName/:query',
    /**
     * 
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     * @param {import('my-classes').Server} server 
     */
    run: async (req, res, server) => {
        const { dbName, modelName, query } = req.params;
        const data = req.body;

        const db = server.databases[dbName]

        if (db) {
            const { redis, model, key } = db.dbs[modelName];
            const dbPath = `&d${dbName}&f/&d${modelName}`

            if (!model) {
                server.utils.log('DATABASE', `&cModel ${dbPath} &cdoesn't exist !`)
                res.status(404).json({ error_code: 'NO_MODEL' })
            } else if (!redis) {
                server.utils.log('DATABASE', `&cRedis ${dbPath} &cdoesn't exist !`)
                res.status(404).json({ error_code: 'NO_REDIS' })
            } else {
                try {
                    const s = Date.now()

                    const dataPath = `${dbPath}&f/&d${key}:${query}`

                    await redis.set(query, data)
                    await model.findOneAndUpdate({ [key]: query }, data)

                    res.send(data)

                    server.utils.log('DATABASE', `&aUpdated ${dataPath} &f[&b${Date.now() - s}ms&f]`)
                } catch (e) {
                    server.utils.log('DATABASE', `&cUpdate ${dataPath} &cfailed`)
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
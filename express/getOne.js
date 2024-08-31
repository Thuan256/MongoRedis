module.exports = {
    method: 'get',
    path: 'getOne/:dbName/:modelName/:query',
    /**
     * 
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     * @param {import('my-classes').Server} server 
     */
    run: async (req, res, server) => {
        const { dbName, modelName, query } = req.params;

        const db = server.databases[dbName]

        if (db) {
            const { redis } = db.dbs[modelName];

            if (!redis) {
                server.utils.log('DATABASE', `&cRedis &d${dbName}&f/&d${modelName} &cdoesn't exist !`)
                res.status(404).json({ error_code: 'NO_REDIS' })
            } else {
                const data = await redis.get(query)
                res.send(data)
            }
        } else {
            server.utils.log('DATABASE', `&cCan not find database &d${dbName}`)
            res.status(404).json({ error_code: 'NO_DATABASE' })
        }
    }
}
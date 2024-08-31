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
async function getAllKeys() {
    let cursor = '0';
    const keys = [];
    do {
        const reply = await client.scan(cursor);
        cursor = reply[0];
        keys.push(...reply[1]);
    } while (cursor !== '0');
    return keys;
}

async function getAllData() {
    const keys = await getAllKeys();
    const data = await Promise.all(keys.map(key => client.get(key)));
    return data;
}
            }
        } else {
            server.utils.log('DATABASE', `&cCan not find database &d${dbName}`)
            res.status(404).json({ error_code: 'NO_DATABASE' })
        }
    }
}
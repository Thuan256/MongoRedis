const mongoose = require('mongoose');
const Redis = require('ioredis')
const { log } = require('my-utils');
const fs = require('node:fs')
const path = require('node:path')


module.exports = {
    run: async (server) => {
        try {
            const { mongooseURI, databases } = server.config

            databases.forEach(async (database) => {

                const [dbName, port] = database.split(':')

                const mongo = mongoose.createConnection(`${mongooseURI}/${dbName}`)
                

                const database = {
                    mongoose: connection,
                    redis: null
                }

                server.databases[dbName] = database

                const modelsPath = path.join(__dirname, `../models/${dbName}`)

                if (fs.existsSync(modelsPath)) {

                    fs.readdirSync(modelsPath)
                        .filter(f => f.endsWith('.js'))
                        .map(file => {
                            const model = require(`${modelsPath}/${file}`).initialize(server)



                        })

                } else log('MODELS', `&cNo model was found for database &d${database}`)

            })

            const db1 = mongoose.createConnection('mongodb+srv://name:password@abc.xyz.mongodb.net/database_1', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
        } catch (e) {
            console.error(e)
        }
    }
} 
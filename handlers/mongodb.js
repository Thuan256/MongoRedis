const mongoose = require('mongoose');
const { log } = require('my-utils');
const fs = require('node:fs')
const path = require('node:path')

module.exports = {
    run: async (server) => {
        try {
            const { mongooseURI, databases } = server.config

            databases.forEach(async (database) => {
                const connection = mongoose.createConnection(`${mongooseURI}/${database}`)

                const modelsPath = path.join(__dirname, `../models/${database}`)

                if (fs.existsSync()) {

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
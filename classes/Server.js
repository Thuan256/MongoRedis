const path = require('node:path')
const EventEmitter = require('events');
const utils = require('my-utils')

exports.Server = class Server extends EventEmitter {
    constructor() {
        const configPath = path.join(__dirname, '../config.json')
        this.config = utils.readFile(configPath)

        this.databases = {}
    }

    get utils() {
        return utils
    }

    
}
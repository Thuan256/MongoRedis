const path = require('node:path')
const EventEmitter = require('events');
const utils = require('my-utils')

exports.Server = class Server extends EventEmitter {
    constructor() {
        super()
        this.databases = {}
    }

    get utils() {
        return utils
    }

    get config() {
        const configPath = path.join(__dirname, '../config.json')
        return utils.readFile(configPath)
    }
}
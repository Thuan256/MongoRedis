const { readFile, log } = require("my-utils")
const path = require('node:path')
const fs = require('node:fs')
const line = '-'.repeat(50)

const server = new class Server {

    constructor() {
        const configPath = path.join(__dirname, './config.json')
        this.config = readFile(configPath)

        this.databases = {}
        this.redis = null
    }
}();

(async () => {

    log('SERVER', '&aInintializing...')

    const start = Date.now()

    const handlers = [];

    fs.readdirSync('./handlers').forEach(async (handler) => {

        if (handler.endsWith('.js')) {
            handlers.push(require(`./handlers/${handler}`))
        } else
            if (fs.existsSync(`./handlers/${handler}/`)) {
                const files = fs.readdirSync(`./handlers/${handler}/`).filter(f => f.endsWith('.js'))

                for (const file of files) {
                    handlers.push(require(`./handlers/${handler}/${file}`))
                }
            }
    });

    async function load() {
        for (const handler of handlers) {
            await handler.run(server)
        }
    }

    await load()

    console.log(line)
    log('SERVER', `&aInintialized in &b${Date.now() - start}ms`);
    console.log(line)
})();

const fs = require('node:fs')
const { log } = require('./log')

exports.readFile = (path) => {
    try {

        if (typeof path !== 'string') return log('READ_FILE', `&cInvalid path &f[&e${path}&f]`);
        if (!fs.existsSync(path)) return log('READ_FILE', `&cCan not find file with path &e${path}`);

        const jsonString = fs.readFileSync(path, 'utf8')
        const json = JSON.parse(jsonString)

        return json
    } catch (e) {
        log('READ_FILE', `&cError parsing JSON in file &e${path}`);
        console.error(e)
    }
}
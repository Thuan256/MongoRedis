const moment = require('moment')

/**
 * 
 * @param {string} name
 * @param {string} message
 */
exports.log = (name, message) => {
    try {
        const timeLabel = `&f[&e${moment(Date.now()).format('D/M • H:m:s')}&f]&r`
        const nameLabel = name ? ` &f[&b${name}&f]&r` : ''
        let finalString = `${timeLabel}${nameLabel} ${message}&r`

        const color_codes = [
            ['c', '31'],
            ['e', '33'],
            ['a', '32'],
            ['f', '37'],
            ['b', '36'],
            ['d', '35'],
            ['r', '0'],
            ['l', '1'],
            ['u', '4'],
            ['8', '38']
        ];

        color_codes.forEach(([a, b]) => {
            finalString = finalString.replaceAll(`&${a}`, `\x1b[${b}m`)
        })

        console.log(finalString);
    } catch (e) {
        console.error(e)
    }
}
const { readFile } = require("my-utils");

const config = readFile('./config.json')

console.log(config);

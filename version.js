const fs = require('fs');
require('dotenv').config();

/**
 * Update version number
 * 
 * @returns { String } the current version number
 * @author Tyler Holewinski
 */
 function getAndUpdateVersion() {
    if (process.env.ENV == 'DEBUG') {
        console.log('debug env... no version update');
        return 'DEBUG';
    }

    const PATH = __dirname + '/api.version';

    if (!fs.existsSync(PATH))
        fs.writeFileSync(PATH, '0'); // create file with version number 0

    let versionNumber = Number.parseInt(fs.readFileSync(PATH));
    fs.writeFileSync(PATH, ++versionNumber);

    return versionNumber.toString();
};

module.exports = { getAndUpdateVersion }
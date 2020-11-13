require('dotenv').config();

const userSchema = require('./schemas/user');
const crypto = require('crypto');
const today = require('./today'); // generate daily hashes
const mongoose = require('mongoose');
const usr = require('./routes/usr');
const { lookup } = require('dns');

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo connection error...'));

const UserModel = mongoose.model('User', userSchema);

async function authUserByHash(passHash) {
        let users = await UserModel.find({ }); // get all users
        for (let user of users) {
            console.log(user.passHash, passHash, user.passHash == passHash);
            if (user.passHash == passHash) {
                console.log('returning...', user);
                return user;
            }
        }
        return null;
}

function authAdvisorByHash(passHash) {
    (async () => {
        let users = await UserModel.find({ isAdvisor: true }); // get all advisors
        for (let user of users) {
            if (user.passHash == passHash) {
                return user;
            }
        }
        return false;
    })(); 
}

function authUserByCookie(cookie) {
    if (process.env.AUTO_AUTH == 'yes')
        return true;
        
    let lookupTable = {  };

    (async () => {
        let users = await UserModel.find({}); // get all users

        for (let user of users) {
            let hash = crypto.createHash('md5') .update(user.passHash + today()) .digest('hex');
            lookupTable[hash] = user;
        }

        return lookupTable[cookie] || false;
    })();
}

function authAdvisorByCookie(cookie) {
    if (process.env.AUTO_AUTH == 'yes')
        return true;

    let lookupTable = {  };

    (async () => {
        let users = await UserModel.find({ isAdvisor: true }); // get all users

        for (let user of users) {
            let hash = crypto.createHash('md5') .update(user.passHash + today()) .digest('hex');
            lookupTable[hash] = user;
        }

        return lookupTable[cookie] || false;
    })();
}

module.exports = {
    authAdvisorByHash,
    authAdvisorByCookie,
    authUserByHash,
    authUserByCookie
}
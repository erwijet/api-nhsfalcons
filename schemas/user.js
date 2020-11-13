const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    "name": String,
    "isAdvisor": { type: Boolean, default: false },
    "passHash": String
});

module.exports = userSchema;
const mongoose = require('mongoose');
const { Schema } = mongoose;

const rdrSchema = new Schema({
    name: { unique: true, type: String },
    url: String
});

module.exports = rdrSchema;
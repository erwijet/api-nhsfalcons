const mongoose = require('mongoose');
const { Schema } = mongoose;

const dtbEntrySchema = new Schema({
    name: { unique: true, type: String },
    isPublic: { default: false, type: Boolean },
    js: String
});

module.exports = dtbEntrySchema;
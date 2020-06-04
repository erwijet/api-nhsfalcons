const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const tutoringSchema = new Schema({
    month: Number,
    count: { default: 0, type: Number } // times tutored
});

module.exports = tutoringSchema;
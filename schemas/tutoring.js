const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const tutoringSchema = new Schema({
    month: Number,
    count: Number // times tutored
});

module.exports = tutoringSchema;
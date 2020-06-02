const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const eventSchema = new Schema({
    title: String,
    day: Number,
    month: Number,
    year: Number,
    isMeeting: { default: false, type: Boolean }
});

module.exports = eventSchema;
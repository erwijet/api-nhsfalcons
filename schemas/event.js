const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const eventSchema = new Schema({
    title: String,
    date: Date
});

module.exports = eventSchema;
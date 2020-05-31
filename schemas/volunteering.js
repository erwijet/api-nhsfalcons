const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const volunteeringSchema = new Schema({
    inDistrict: Boolean,
    hours: Number,
    title: String,
    day: Number,
    month: Number,
    year: Number
});

module.exports = volunteeringSchema;
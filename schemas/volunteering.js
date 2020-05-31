const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const volunteeringSchema = new Schema({
    inDistrict: Boolean,
    hours: Number,
    title: String,
    date: Date
});

module.exports = volunteeringSchema;
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const tutoringSchema = require('./tutoring');
const eventSchema = require('./event');
const volunteeringSchema = require('./volunteering');

const memberSchema = new Schema({
    name: String,
    grade: Number,
    probation: { default: false, type: Boolean},
    position: { default: 'member', type: String },
    active: { default: true, type: Boolean },
    cord: { default: false, type: Boolean },
    tutoring: { default: [], type: [tutoringSchema] },
    attendence: { default: [], type: [eventSchema] },
    volunteering: { default: [], type: [volunteeringSchema] }
});

module.exports = memberSchema;
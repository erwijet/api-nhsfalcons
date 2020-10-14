const { Router } = require('express');
const today = require('../today'); // validate auth tokens
const memberSchema = require('../schemas/member');
const eventSchema = require('../schemas/event');
const tutoringSchema = require('../schemas/tutoring');
const volunteeringSchema = require('../schemas/volunteering');
const mongoose = require('mongoose');

mongoose.connect(process.env.DB_STRING, { useUnifiedTopology: true, useNewUrlParser: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo connection error...'));

let raw = Router();
let MemberModel = mongoose.model('Member', memberSchema);

function validate(req) {
    let { auth } = req.body;

    if (!auth) return false; // no access token -> no access
    return auth == today();
}

raw.post('/query', (req, res, next) => {
    let { auth, query } = req.body;

    if (!auth || !query) {
        res.json({
            code: 400,
            msg: 'Auth and Query are both required'
        });
        return;
    }

    console.log(auth, today(), auth == today());

    if (!validate(req)) {
        res.json({
            code: 401,
            msg: "Not Authorized"
        });
        return;
    }

    (async () => {
        let docs;
        let failed;

        try { docs = await MemberModel.find(query); }
        catch(ex) { res.json({code: 400, msg: ex}); failed = true; }

        if (failed) next();

        res.json({
            code: 200,
            msg: "ok",
            docs
        });
    })();
});

raw.post('/remove', (req, res, next) => {
    let { query } = req.body;
    if (!query) {
        res.json({
            code: 400,
            msg: 'query required'
        });
        return;
    }

    if (!validate(req)) {
        res.json({
            code: 401,
            msg: "Not Authorized"
        });
        return;
    }

    (async () => {
        let docs = await MemberModel.find(query);
        let err = await MemberModel.remove(query);

        res.json({
            code: 200,
            msg: err ? 'err' : 'ok',
            docs: err || docs
        });
    })();
});


raw.post('/agg', (req, res, next) => {
    let { query } = req.body;
    if (!query) {
        res.json({
            code: 400,
            msg: 'query required'
        });
        return;
    }

    if (!validate(req)) {
        res.json({
            code: 401,
            msg: 'Not Authorized'
        });
        return;
    }

    (async () => {
        let docs = await MemberModel.aggregate(query);

        res.json({
            code: 200,
            msg: 'ok',
            docs
        });
        return;
    })();
});

raw.post('/:_', (req, res) => {
    res.json({
        code: 400,
        msg: 'err'
    });
})

module.exports = raw;
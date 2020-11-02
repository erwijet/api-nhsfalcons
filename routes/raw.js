const { Router } = require('express');
const today = require('../today'); // validate auth tokens
const memberSchema = require('../schemas/member');
const eventSchema = require('../schemas/event');
const tutoringSchema = require('../schemas/tutoring');
const volunteeringSchema = require('../schemas/volunteering');
const mongoose = require('mongoose');
const { MongoNetworkError } = require('mongodb');

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

raw.post('/query', (req, res) => {
    let { auth, query } = req.body;

    if (!auth || !query) {
        res.json({
            code: 400,
            msg: 'Auth and Query are both required'
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
        let docs;
        let failed;

        let serverInstructions = query['@returns'];
        if (typeof serverInstructions != 'undefined')
            query['@returns'] = undefined; // remove @returns and store to different variable

        try { docs = await MemberModel.find(query); }
        catch(ex) { res.json({code: 400, msg: ex}); failed = true; }

        if (typeof serverInstructions != 'undefined') {
            if (serverInstructions.omit) {
                for (let i in docs) {
                    let _this = JSON.parse(JSON.stringify(docs[i]));
                    let newI = { };
                    for (let key of Object.keys(_this)) {
                        if (!serverInstructions.omit.includes(key))
                            newI[key] = docs[i][key];
                    }
                    docs[i] = newI;
                }
            }
        }

        if (typeof serverInstructions != 'undefined') {
            try {
                if (typeof serverInstructions.select != 'undefined') {
                    let selectMe = [...serverInstructions.select];

                    for (let i in docs) {
                        let newI = { };
                        for (let key of selectMe) {
                            // console.log(key, i, docs[i][key]);
                            if (typeof docs[i][key] != 'undefined') {
                                newI[key] = docs[i][key];
                                // console.log(key, typeof docs[i][key], newI);
                            }
                        }
                        docs[i] = newI;
                    }
                }

                if (typeof serverInstructions.rename != 'undefined') {
                    let rename = [...serverInstructions.rename];

                    for (let i in docs) {
                        for (let e of rename) {
                            docs[i][rename[e]] = docs[i][e];
                            docs[i][e] = undefined;
                        }
                    }
                }

                if (typeof serverInstructions.transform != 'undefined') {
                    let { in: _in, out: _out, js } = serverInstructions.transform;
                    
                    console.log(_in, _out, js);

                    if (_in && _out && js) {
                        if (_out == '__returns' || _out == 'done')
                            _out = '_returns';
                        if (_in == 'docs' || _out == 'done')
                            _in = '_docs';

                        let __returns = [];
                        let done = false;
                        eval(`if (typeof ${_in} == 'undefined') { let ${_in}; };`);
                        eval(`if (typeof ${_out} == 'undefined') { let ${_out}; };`);
                        eval(`(async () => { ${_in} = [...docs]; ${_out} = []; ${js} __returns = ${_out}; done = true; return; })();`);

                        while (!done) { }

                        docs = [...__returns];
                    }
                }
            } catch (ex) { console.log(ex); res.json({ code: 400, err: ex.toString() }); failed = true; return; }
        }
        if (failed) return;

        res.json({
            code: 200,
            msg: "ok",
            docs
        });

        return;
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
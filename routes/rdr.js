const { Router } = require('express');
const rdrSchema = require('../schemas/redirect');
const today = require('../today');
const mongoose = require('mongoose');

let rdr = Router();

mongoose.connect(process.env.DB_STRING, { useUnifiedTopology: true, useNewUrlParser: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo connection error...'));

let RedirectModel = mongoose.model('Redirect', rdrSchema);

rdr.post('/insert', (req, res) => {
    let { auth, name, url } = req.body;

    if (!name || !url) {
        res.json({
            code: 400,
            msg: 'name, and url are all required'
        });
        return;
    }

    if (!auth) {
        res.json({
            code: 401,
            msg: 'auth token required'
        });
        return;
    }

    if (auth != today()) {
        res.json({
            code: 403,
            msg: 'Forbidden'
        });
        return;
    }

    (async () => {
        let dbQuery = await RedirectModel.find({ name }); // lookup existing links by name
        if (dbQuery.length != 0) {
            res.json({
                code: 422,
                msg: 'Resource already exists with uid (name) specified. No modication has been made.',
                dbQuery,
                name,
                url
            });
            return;
        }

        let dbRes = await RedirectModel.create({ name, url });
        res.json({
            code: 200,
            msg: 'ok',
            name,
            url,
            dbRes
        });
    })();
});

rdr.get('/find', (req, res) => {
    (async () => {
        console.log(req.query, req.query.q);
        let dbRes = await RedirectModel.find({ name: req.query.q });
        if (dbRes.length == 0) {
            res.json({ code: 404, msg: 'No entry found' })
            return;
        }

        dbRes = dbRes.shift(); // get first object, but since name is a uid, there should only be one

        res.json({
            code: 200,
            msg: 'ok',
            name: dbRes.name,
            url: dbRes.url
        })
    })();
});

module.exports = rdr;

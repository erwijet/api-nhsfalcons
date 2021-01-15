const { Router } = require('express');
const today = require('../today');
const mongoose = require('mongoose');
const dtbEntrySchema = require('../schemas/dtbEntry');

const dtb = Router();
const DtbEntryModel = mongoose.model('DtbEntry', dtbEntrySchema)

function invalidateRequest(res) {
    res.json({
        code: 401,
        msg: 'Forbidden. Missing or invalid auth token'
    });
}

dtb.post('/insert', (req, res) => {
    // authenticate request
    if (req.body.auth != today()) {
        invalidateRequest(res);
        return;
    }

    const { name, isPublic, js } = req.body;

    console.log(name, typeof name);
    console.log(js, typeof js);
    console.log(isPublic == null || typeof isPublic == 'boolean');

    if (typeof name == 'string' &&
        typeof js == 'string' &&
        (isPublic == null || typeof req.body.isPublic == 'boolean'))
        
        {
            // begin async
            (async () => {
                const dbRes = await DtbEntryModel.create({ name, isPublic, js});
                res.json({
                    code: 200,
                    msg: 'ok',
                    name,
                    isPublic,
                    js,
                    dbRes
                });
                return;
            })();
        }

        else {
            res.json({
                code: 400,
                msg: 'bad request'
            });
            return;
        }
});

dtb.post('/update', (req, res) => {
});

dtb.post('/delete', (req, res) => {

});

dtb.get('/find/:name', (req, res) => {
    const { name } = req.params;

    (async () => {
        const dbRes = await DtbEntryModel.find({ name });
        res.end(JSON.stringify(dbRes));
    })();
});

module.exports = dtb;
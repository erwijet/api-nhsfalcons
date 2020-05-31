require('dotenv').config();
const { Router } = require('express');

const memberSchema = require('../schemas/member');

const mongoose = require('mongoose');
mongoose.connect(process.env.DB_STRING, { useUnifiedTopology: true, useNewUrlParser: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo connection error...'));

const VALID_THINGS = ['member', 'event'];
const VALID_ACTIONS = ['create', 'update', 'remove', 'query'];
const VALID_POSITIONS = ['president', 'vice-president', 'secretary', 'treasurer', 'member']
let router = Router();

router.post('/:thing/:action', (req, res, next) => {
    let { thing, action } = req.params;
    if (!VALID_THINGS.includes(thing) || !VALID_ACTIONS.includes(action))
        next();

    switch (thing) {
        case 'member':
            let MemberModel = mongoose.model('Member', memberSchema);
            
            switch (action) {
                case 'create':
                    let { name, grade, position } = req.body;
                    console.log(position);
                    if (position) {
                        if (!VALID_POSITIONS.includes(position)) {
                            res.json({
                                code: 400,
                                msg: 'invalid position. Position must be a member of  ' + VALID_POSITIONS.toString()
                            });
                            return;
                        }
                    }

                    if (!name || !grade) {
                        res.json({
                            code: 400,
                            msg: "Please provide a name and grade"
                        });
                        return;
                    }

                    MemberModel.create({
                        position,
                        name,
                        grade
                    }, (err, member) => res.json({
                        code: 200,
                        msg: 'ok',
                        member
                    }));
                    break;
                case 'update':
                    let { filter, update } = req.body;
                    filter = filter || req.body.query;
                    if (!update) {
                        res.json({
                            code: 400,
                            msg: 'Error! Please provide an "update" object to use to replace values'
                        });
                        return;
                    }
                    (async () => {
                        let docs = await MemberModel.find(filter);
                        for (let doc of docs) {
                            for (let item of Object.keys(update)) {
                                if (doc[item] !== undefined)
                                    doc[item] = update[item];
                            }
                            doc.save();
                        }

                        res.json({
                            code: 200,
                            msg: 'ok',
                            docs,
                            filter,
                            update
                        })
                    })();
                    break;
                case 'query':
                    let { query, sort } = req.body;
                    sort = sort || { };
                    sort.name = 1; // sort alpha by name
                    (async () => {
                        // load with async insted of with callbacks
                        const docs = await MemberModel.find(query).sort(sort);
                        res.json({
                            code: 200,
                            msg: 'ok',
                            docs
                        });
                    })();
                    break;
            }
    }
});

module.exports = router;
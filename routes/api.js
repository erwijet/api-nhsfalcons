require('dotenv').config();
const { Router } = require('express');

const memberSchema = require('../schemas/member');
const eventSchema = require('../schemas/event');
const tutoringSchema = require('../schemas/tutoring');
const volunteeringSchema = require('../schemas/volunteering');

const mongoose = require('mongoose');
mongoose.connect(process.env.DB_STRING, { useUnifiedTopology: true, useNewUrlParser: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo connection error...'));

const VALID_THINGS = ['member', 'event'];
const VALID_ACTIONS = ['create', 'update', 'query'];
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

                    try {
                        query = JSON.parse(query);
                        sort = JSON.parse(sort);
                    } catch (ex) { }

                    if ((typeof query != 'undefined' && typeof query != 'object') || (typeof sort != 'undefined' && typeof sort != 'object')) {
                        // if query is not an object or if sort is defined as anything other than an object -->
                        res.json({
                            code: 400,
                            msg: `Error, query and sort both must be of type "object" (sort may be undefined). got types sort: ${typeof sort}, query: ${typeof query}`,
                            sort,
                            query
                        });
                        return;
                    }
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
            break;
        case 'event':
            let EventModal = mongoose.model('Event', eventSchema);
            switch (action) {
                case 'create':
                    let { title, day, month, year, isMeeting } = req.body;
                    
                    day = Number.parseInt(day);
                    month = Number.parseInt(month);
                    year = Number.parseInt(year);
                    
                    if (!title || typeof day != 'day' || typeof month != 'number' || typeof year != 'number') {
                        res.json({
                           code: 400,
                           msg: 'Error, please provide both a title and a date' 
                        });
                        return;
                    }

                    EventModal.create({ title, date, isMeeting }, (err, event) => {
                        res.json({
                            code: 200,
                            msg: 'ok',
                            event
                        })
                    });

                    break;
                case 'update':
                    let { filter, update } = req.body;
                    if (!update) {
                        res.json({
                            code: 400,
                            msg: 'Error. Please provide update object'
                        });
                        return;
                    }

                    (async () => {
                        let docs = await EventModal.find(filter);
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
                    if (typeof query != 'object' || (typeof sort != 'undefined' && typeof sort != 'object')) {
                        // if query is not an object or if sort is defined as anything other than an object -->
                        res.json({
                            code: 400,
                            msg: 'Error, query and sort both must be of type "object"',
                            sort,
                            query
                        });
                        return;
                    }

                    sort = sort || { };
                    sort.date = 1; // sort alpha by name
                    (async () => {
                        // load with async insted of with callbacks
                        const docs = await EventModal.find(query).sort(sort);
                        res.json({
                            code: 200,
                            msg: 'ok',
                            docs
                        });
                    })();
                    break;
            }
            break;
    }
});

router.post('/volunteering/new', (req, res) => {
    let { memberID, inDistrict, hours, day, month, year, title} = req.body;

    inDistrict = inDistrict == 'true';
    hours = Number.parseInt(hours);
    day = Number.parseInt(day);
    month = Number.parseInt(month);
    year = Number.parseInt(year);

    if (typeof hours != 'number' || typeof title != 'string' || typeof year != 'number' || typeof day != 'number' || typeof month != 'number') {
            res.json({
                code: 400,
                msg: `Error, please provide  memberID, inDistrict (bool), hours (num), title (str), day (int), month (int), and year (int). Got ${typeof memberID}, ${typeof inDistrict}, ${typeof hours}, ${typeof title}, ${typeof day}, ${typeof month}, ${typeof year}`
            });
            return;
    }

    let VolunteeringModel = mongoose.model('Volunteering', volunteeringSchema);
    let MemberModel = mongoose.model('Member', memberSchema);
    VolunteeringModel.create({ title, day, month, year, inDistrict, hours }, (err, doc) => {
        (async () => {
            let member = await MemberModel.findOne({ _id: memberID });
            member.volunteering.push(doc);
            await member.save();

            res.json({
                code: 200,
                msg: 'ok',
                member,
                volunteeringDoc: doc
            });
        })();
    });
});

router.post('/tutoring/create', (req, res) => {
    let { month, count, memberID } = req.body;

    month = Number.parseInt(month);
    if (typeof count != 'undefined')
        count = Number.parseInt(count);

    if (typeof month != 'number' || Number.isNaN(month)|| month < 1 || month > 12 || typeof memberID != 'string' || ( typeof count != 'undefined' && typeof count != 'number' )) {
        res.json({
            code: 400,
            msg: 'bad request. month must be an integer (1 <= n <= 12) and count must be an integer. MemberID must be a string. Count is optional (default. 0)',
            count,
            memberID,
            month
        });

        return;
    }

    let MemberModel = mongoose.model('Member', memberSchema);
    MemberModel.find({_id: memberID}, (err, members) => {
        if (err) {
            res.json({
                code: 400,
                msg: 'error when loading members',
                err
            });
            return;
        }

        let member = members[0];
        
        for (let tutoringInstance of member.tutoring) {
            if (tutoringInstance.month == month) {
                res.json({
                    code: 401,
                    msg: `create request rejected. month '${month}' already exists: ${members[0].name}(${members[0].name} -> ${tutoringInstance})`,
                });
                return;
            }
        }

        (async () => {
            let TutoringModel = mongoose.model('Event', tutoringSchema);
            let tutoringSession = await TutoringModel.create({month, count});
            member.tutoring.push(tutoringSession);
            await member.save(); // update record

            res.json({
                code: 200,
                msg: 'ok',
                tutoringSession,
                member
            });
        })();
    });
});

router.post('/tutoring/update', (req, res) => {
    let { memberID, month, count } = req.body;

    month = Number.parseInt(month);
    count = Number.parseInt(count);

    if (
        typeof memberID != 'string' ||
        Number.isNaN(month) ||
        Number.isNaN(count)
    ) {
        res.json({
            code: 400,
            msg: 'error! memberID must be of type string. month, and count both must be of type number'
        });
        return;
    }

    let MemberModel = mongoose.model('Member', memberSchema);
    MemberModel.find({ _id: memberID }, (err, members) => {
        if (err) {
            res.json({
                code: 400,
                msg: 'error in loading member of id ' + memberID,
                err
            });
            return;
        }

        let member = members[0]; // take first result

        (async () => { 
            for (let i in member.tutoring) {
                let session = member.tutoring[i];
                if (session.month == month) {
                    member.tutoring[i].count = count;
                    await member.save();

                    res.json({
                        code: 200,
                        msg: 'ok',
                        member,
                        updatedSession: session
                    });
                    return;
                }
            }

            res.json({
                code: 400,
                msg: 'Error! no session could be found for member ' + memberID + ' with month ' + month
            });
        })();
    })

});


module.exports = router;
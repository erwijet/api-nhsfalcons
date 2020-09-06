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
                    let { filter } = req.body;
                    let update = req.body.update;
                    filter = filter || req.body.query;
                    if (typeof update == 'undefined') {
                        res.json({
                            code: 400,
                            msg: 'Error! Please provide an "update" object to use to replace values',
                            update,
                            filter
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
                    
                    if (typeof title != 'string' ||
                        (typeof isMeeting != 'boolean' && typeof isMeeting != 'undefined') ||
                        Number.isNaN(day) || 
                        Number.isNaN(month) ||
                        Number.isNaN(year)) {
                        res.json({
                            code: 400,
                            msg: 'error. title must be of type "string"; day, month, and year must of type "number" and integers. isMeeting must be of type "boolean" or "undefined"'
                        });
                        return;
                    }

                    EventModal.create({ title, day, month, year, isMeeting }, (err, event) => {
                        res.json({
                            code: 200,
                            msg: 'ok',
                            event
                        })
                    });

                    break;
                case 'update':
                    let { filter, update } = req.body;
                    if (typeof update == 'undefined') {
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

                    if (typeof query != 'undefined' || typeof sort != 'undefined') {
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

router.post('/attendence/update-bulk', (req, res) => {
    let memberIDs = req.body.memberIDs;
    let sample;
    try { sample = memberIDs[0] } catch (ex) { }
    if (typeof memberIDs != 'object' || typeof sample != 'string') {
        res.json({
            code: 400,
            msg: 'Error! memberIds must be a non-empty array of strings',
            memberIDs
        });
        return;
    }

    let { eventID, state } = req.body;
    if (state.toLowerCase() == 'true')
        state = true;
    else if (state.toLowerCase() == 'false')
        state = false;
    else
        state = undefined;
    
    if (typeof eventID != 'string' || typeof state != 'boolean') {
        res.json({
            code: 400,
            msg: 'Error! eventID must be of type "string" and state must be of type "boolean"'
        });
        return;
    }

    let EventModal = mongoose.model('Event', eventSchema);
    let MemberModel = mongoose.model('Member', memberSchema);

    EventModal.find({_id: eventID}, (err, events) => {
        if (err) {
            res.json({
                code: 400,
                msg: 'Error when loading event with id of ' + eventID,
                err
            });
            return;
        }

        if (events.length < 1) {
            res.json({
                code: 400,
                msg: 'No event could be found with the ID ' + eventID
            });
            return;
        }

        let event = events.shift(); // get first and only item w/o null pointer nonsense

        MemberModel.find({ _id: { $in: memberIDs } }, async (err, members) => {
            if (err) {
                res.json({
                    code: 400,
                    msg: 'error in loading members with ids of ' + memberIDs,
                    err
                });
                return;
            }

            for (let member of members) {
                if (state) {
                    let skip = false;
                    for (let evt of member.attendence) {
                        if (evt._id == eventID)
                            skip = true
                    }
                    if (!skip) {
                        member.attendence.push(event);
                        await member.save();
                    }
                } else {
                    let i;
                    for (let e in member.attendence) {
                        let evt = member.attendence[e];
                        if (evt._id == eventID) {
                            i = e;
                        }
                    }

                    if (typeof i != 'undefined') {
                        console.log(member, i);
                        member.attendence.splice(i, 1);
                        console.log(member);
                        await member.save();
                    }
                }
            }

            res.json({
                code: 200,
                msg: 'ok',
                members,
                event,
                state
            })
        });
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

router.post('/attendence/remove', (req, res) => {
    let { memberID, eventID } = req.body;
    if (typeof memberID != 'string' || typeof eventID != 'string') {
        res.json({
            code: 400,
            msg: 'Error! eventID and memberID both must be of type string. Got (mid) ' + typeof memberID + ' and (eid)' + typeof eventID
        });
        return;
    }

    let MemberModel = mongoose.model('Member', memberSchema);

    MemberModel.find({ _id: memberID }, (err, memberDocs) => {
        if (err) {
            res.json({
                code: 400,
                msg: 'Error when loading member with id of ' + memberID,
                err
            });
            return;
        }

        let member = memberDocs.shift();

        let instancesExist = true;

        while (instancesExist) {
            instancesExist = false;
            for (let _evt of member.attendence) {
                if (_evt._id == eventID) {
                    instancesExist = true;
                    break;
                }
            }

            for (let i in member.attendence) {
                if (member.attendence[i]._id == eventID) {
                    member.attendence.splice(i, 1); // remove element at i
                }
                break;
            }
        }

        member.save();
    });
});

module.exports = router;
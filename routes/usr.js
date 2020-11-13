const { Router } = require('express');

const authme = require('../authme'); // auth users / advisors

const userSchema = require('../schemas/user');
const mongoose = require('mongoose');

mongoose.connect(process.env.DB_STRING, { useUnifiedTopology: true, useNewUrlParser: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo connection error...'));

const UserModel = mongoose.model('User', userSchema);

const usr = Router();

usr.get('/authUser/:passHash', (req, res) => {
    (async () => {
        let authRes = await authme.authUserByHash(req.params.passHash);

        console.log(authRes);

        if (authRes != null)
            res.json({
                code: 200,
                msg: 'authed',
                user: authRes
            });
        else
            res.json({
                code: 401,
                msg: 'not authed'
            });
    })();
});

usr.post('/query', (req, res) => {
    let query = req.body.query || { };

    (async () => {
        let authRes = authme.authAdvisorByCookie(req.cookies.nhsfalconsauth);

        if (!authRes) {
            res.json({
                code: 401,
                msg: 'not authed',
                query
            });
            return;
        } else {
            let docs = await UserModel.find(query);

            res.json({
                code: 200,
                msg: 'ok; authed',
                docs
            })
        }
    })();
});

usr.post('/remove', (req, res) => {
    (async () => {
        if (typeof req.body.query == 'undefined') {
            res.json({
                code: 400,
                msg: 'Bad Request. Must have truthy query object'
            });
            return;
        }

        if (authme.authUserByCookie(req.cookies.nhsfalconsauth)) {
            let mongooseResponse = await UserModel.remove(req.body.query);
            res.json({
                code: 200,
                msg: 'ok',
                query: req.body.query,
                mongooseResponse
            });
        } else {
            res.json({
                code: 401,
                msg: 'not authed',
                authCookie: req.cookies.nhsfalconsauth
            })
        }
    })();
});

usr.post('/update', (req, res) => {
    (async () => {
        let { query, update } = req.query;
        if (typeof query != 'undefined' && typeof update != 'undefined') {
            if (authme.authAdvisorByCookie(req.cookies.nhsfalconsauth || '')) {
                let mongooseResponse = await UserModel.update(query, update);
                res.json({
                    code: 200,
                    msg: 'ok',
                    mongooseResponse
                });
                return;
            } else {
                res.json({
                    code: 401,
                    msg: 'not authed. Elevated Permissions Required.'
                });
                return;
            }
        } else {
            res.json({
                code: 400,
                msg: 'Bad Request, query and update both must be truthy',
                query,
                update
            });
        }
    })();
});

usr.post('/create', (req, res) => {
    (async () => {
        let { name, isAdvisor, passHash } = req.body;

        if (typeof name == 'string' && typeof passHash == 'string') {
            let authRes = authme.authAdvisorByCookie(req.cookies.nhsfalconsauth);
            if (!authRes) {
                res.json({
                    code: 401,
                    msg: 'not authed',
                    name, isAdvisor, passHash
                });
                return;
            } else {
                let newUser = await UserModel.create({ name, passHash, isAdvisor: isAdvisor || false });
                res.json({
                    code: 200,
                    msg: 'ok; authed; created',
                    newUser
                });
                return;
            }
        } else {
            res.json({
                code: 400,
                msg: 'Bad Request. name and passHash both required fields'
            });
            return;
        }
    })();
});

module.exports = usr;
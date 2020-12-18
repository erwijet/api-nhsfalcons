const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser')
require('dotenv').config();

const VERSIONNUMBER = require('./version').getAndUpdateVersion()

const api = require('./routes/api');
const usr = require('./routes/usr');
const raw = require('./routes/raw');
const rdr = require('./routes/rdr');
const PORT = process.env.PORT || 2020;

let app = express();
app.use(morgan('common'));
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(cors());
app.use('/rdr', rdr);
app.use(express.json());
app.use('/', api);
app.use('/usr', usr);
app.use('/raw', raw);

app.get('/', (req, res) => res.end('[API instance] # ' + VERSIONNUMBER));

app.listen(PORT, console.log(`Server listening on http://localhost:${PORT}...`));
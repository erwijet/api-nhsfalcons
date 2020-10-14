const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

const api = require('./routes/api');
const raw = require('./routes/raw');
const rdr = require('./routes/rdr');
const PORT = process.env.PORT || 2020;

let app = express();
app.use(morgan('common'));
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(cors());
app.use('/rdr', rdr);
app.use(express.json());
app.use('/', api);
app.use('/raw', raw);

app.listen(PORT, console.log(`Server listening on http://localhost:${PORT}...`));
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

const api = require('./routes/api');
const PORT = process.env.PORT || 2020;

let app = express();
app.use(morgan('common'));
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(cors());
app.use('/', api);

app.listen(PORT, console.log(`Server listening on http://localhost:${PORT}...`));
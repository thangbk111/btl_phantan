const express = require('express');
const router = express.Router();
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
const morgan = require('morgan');
var users = require('./routes/users');

const app = express();
app.set('port', 3000);

app.use(express.json());
// set morgan to log info about our requests for development use.
app.use(morgan('dev'));
// initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({ extended: true }));

// Route
app.use('/api/users', users);
app.listen(app.get('port'), () => console.log(`Listing to port ${app.get('port')}`));
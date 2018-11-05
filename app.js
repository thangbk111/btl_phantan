const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const morgan = require('morgan');
var users = require('./routes/users');
var meetings = require('./routes/meetings');
var roles = require('./routes/roles');
var subContents = require('./routes/sub_contents');
var faker = require('./faker');

const app = express();
//Configs
app.set('port', 3000);


//Use Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));

// Route
app.use('/api/users', users);
app.use('/api/meetings', meetings);
app.use('/api/text_processing', subContents);
app.use('/faker', faker);
app.listen(app.get('port'), () => console.log(`Listing to port ${app.get('port')}`));
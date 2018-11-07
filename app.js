const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const morgan = require('morgan');
var users = require('./routes/users');
var meetings = require('./routes/meetings');
var roles = require('./routes/roles');
var subContents = require('./routes/sub_contents');
var isAuthenticated = require('./middleware/authenticate');

const app = express();
//Configs
app.set('port', 3000);


//Use Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));

// Route
app.use('/api/users', users);
app.use('/api/meetings',isAuthenticated, meetings);
app.use('/api/text_processing', isAuthenticated, subContents);
app.use('/api/invite_meeting', isAuthenticated, roles);
app.listen(app.get('port'), () => console.log(`Listing to port ${app.get('port')}`));
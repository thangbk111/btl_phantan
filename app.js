const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const morgan = require('morgan');
var faker = require('./faker');

const app = express();
//Configs
app.set('port', 3000);


//Use Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));

// Route
app.use('/faker', faker);

app.listen(app.get('port'), () => console.log(`Listing to port ${app.get('port')}`));
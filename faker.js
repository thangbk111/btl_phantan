const express = require('express');
const router = express.Router();
const faker = require('faker');
var User = require('../models/user');

const maxRecord = 10;

router.get('/', (req, res) => {
    //Fake User
    for (let i = 0; i < 10; i++) {
	    User.create({
	        name: faker.fake("{{name.lastName}} {{name.firstName}}"),
	        email: req.body.email,
	        password: req.body.password
	    });
    }
});

module.exports = router;
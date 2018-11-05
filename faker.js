const express = require('express');
const router = express.Router();
const faker = require('faker');
var User = require('./models/user');
var Meeting = require('./models/meeting');

const maxRecord = 10;

router.get('/all', (req, res) => {
    //Fake User
    for (let i = 0; i < maxRecord; i++) {
	    User.create({
	        name: faker.fake("{{name.lastName}} {{name.firstName}}"),
	        email: faker.internet.email(),
	        password: '1234'
	    });
	}

    for (let i = 0; i < maxRecord; i++) {
		var userKeys = [];
		User.all().then(users => {
			for (let i = 0; i < users.length; i++) {
				userKeys.push(users[i].dataValues.id);
			}
			Meeting.create({
				title: faker.lorem.slug(),
				user_created_id: userKeys[Math.floor(Math.random() * userKeys.length)]
			});
		})
	}
	
});

router.get('/users', (req, res) => {
    for (let i = 0; i < maxRecord; i++) {
	    User.create({
	        name: faker.fake("{{name.lastName}} {{name.firstName}}"),
	        email: faker.internet.email(),
	        password: '1234'
	    });
	}
});

router.get('/meetings', (req, res) => {
    for (let i = 0; i < maxRecord; i++) {
		var userKeys = [];
		User.all().then(users => {
			for (let i = 0; i < users.length; i++) {
				userKeys.push(users[i].dataValues.id);
			}
			Meeting.create({
				title: faker.lorem.slug(),
				user_created_id: userKeys[Math.floor(Math.random() * userKeys.length)]
			});
		})
	}	
});

module.exports = router;
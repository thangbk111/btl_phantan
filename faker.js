const express = require('express');
const router = express.Router();
const faker = require('faker');
var User = require('./models/user');
var Meeting = require('./models/meeting');

router.get('/all/:maxRecord', (req, res) => {
	const maxRecord = req.params.maxRecord;
    //Fake User
    for (let i = 0; i < maxRecord; i++) {
	    User.create({
	        name: faker.fake("{{name.lastName}} {{name.firstName}}"),
	        email: faker.internet.email(),
	        password: '1234'
	    });
	}

	//Fake Meeting
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
	return res.json('OK');
});

router.get('/users/:maxRecord', (req, res) => {
	const maxRecord = req.params.maxRecord;
    for (let i = 0; i < maxRecord; i++) {
	    User.create({
	        name: faker.fake("{{name.lastName}} {{name.firstName}}"),
	        email: faker.internet.email(),
	        password: '1234'
	    });
	}
	return res.json('OK');
});

router.get('/meetings/:maxRecord', (req, res) => {
	const maxRecord = req.params.maxRecord;
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
	return res.json('OK');	
});

module.exports = router;
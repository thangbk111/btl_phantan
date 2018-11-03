const Joi = require('joi');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
var User = require('../models/user');

router.post('/login', (req, res) => {
    User.findOne({
        where: {
            email: req.body.email
        }
    }).then(user => {
        //User is not exist
        if (!user) {
            return res.json({'error': true, 'message': 'User not exist'});
        }
        //Check User Password
        if (bcrypt.compareSync(req.body.password, user.password)) {
            const payload = {
                id: user.id
            };
            var token = jwt.sign(payload, 'btl_phantan', {
                expiresIn: '24h' // expires in 24 hours
            });
            res.json({ 'sucess': true, 'data': user, "token": token});
        } else {
            res.json({'error': true, 'message': 'Password Wrong !!!'});
        }
    });
});

router.post('/signup', (req, res) => {
    User.findOne({
        where: {
            email: req.body.email
        }
    }).then(user => {
        //User is exist
        if (user) {
            return res.json({'error': true, 'message': 'User is exist. Please sign in or choose another email'});
        }
        //Check validate
        var { error } = validateUser(req.body);
        if (error) {
            res.json({'error': true, 'message': error.details[0].message});
        } else {
            //Create new User
            User.create({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            }).then(newUser => {
                res.json({'success':true, 'data': newUser});
            });
        }
    });
});

function validateUser(user) {
    // Schema to validate
    const schema = Joi.object().keys({
        name: Joi.string().required(),
        email: Joi.string().required().regex(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/),
        password: Joi.string().min(3).required()
    });
    return Joi.validate(user, schema);
}
module.exports = router;
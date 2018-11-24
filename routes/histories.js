const express = require('express');
const router = express.Router();
var History = require('../models/history');
var User = require('../models/user');
var SubContent = require('../models/sub_content');

router.get('/', (req, res) => {
    History.findAll().then(histories => {
        return res.json(histories);
    });
});

router.get('/user_id/:userId', (req, res) => {
    User.findById(req.params.userId).then(user => {
        return res.json(user);
    });
});

router.get('/subcontent_id/:subContentId', (req, res) => {
    SubContent.findById(req.params.subContentId).then(subcontent => {
        return res.json(subcontent);
    });
});

module.exports = router;
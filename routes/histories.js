const express = require('express');
const router = express.Router();
var History = require('../models/history');
var User = require('../models/user');
var SubContent = require('../models/sub_content');
var Meeting = require('../models/meeting');

router.get('/', (req, res) => {
    History.findAll({
        order: [
            ['created_at', 'DESC']
        ]
    }).then(histories => {
        var count = histories.length;
        for (let i = 0; i < histories.length; i++) {
            User.findById(histories[i].change_by).then(user => {
                count--;
                histories[i].change_by = user.email;
                if (count === 1) {
                    return res.json({ 'status': true, 'data': histories});
                }
            });
        }
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

router.get('/meeting_id/:meetingId', (req, res) => {
    Meeting.findById(req.params.meetingId).then(meeting => {
        return res.json(meeting);
    });
});

module.exports = router;
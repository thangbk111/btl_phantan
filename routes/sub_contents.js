const Joi = require('joi');
const express = require('express');
const router = express.Router();
var subContent = require('../models/sub_content');

router.get('/:meetingId', (req, res) => {
    console.log('get content.........');
    subContent.findAll({
        where: {
            meeting_id: req.params.meetingId
        },
        order: [
            ['start_time', 'ASC']
        ]
    }).then(subContents => {
        res.json({'success': true, 'data': subContents});
    });
});

module.exports = router;
const Joi = require('joi');
const express = require('express');
const router = express.Router();
var SubContent = require('../models/sub_content');
var Meeting = require('../models/meeting');
var Authorization = require('../middleware/authorization');



router.get('/:meetingId', Authorization.isViewer, (req, res) => {
    SubContent.findAll({
        where: {
            meeting_id: req.params.meetingId
        },
        order: [
            ['start_time', 'ASC']
        ]
    }).then(subContents => {
        return res.json({'status': true, 'data': subContents});
    });
});

router.post('/:meetingId', Authorization.isEditerOrOwnerMeeting, (req, res) => {
    Meeting.findById(req.params.meetingId).then(meeting => {
        if (!meeting) {
            return res.json({ 'status': false, 'data': 'There is no Meeting like that'});
        }
        var errors = [];
        var subContents = [];
        for (var i = 0; i < req.body.content.length; i++) {
            var { error } = validateSubContent(req.body.content[i]);
            if (error) {
                errors.push('\n Error in number_id: ' + req.body.content[i].number_id + ' --- Message: ' + error.details[0].message);
            }
        }
        if (errors.length !== 0) {
            return res.json({'status': false, 'data': errors});
        }
        for (let i = 0; i < req.body.content.length; i++) {
            SubContent.findOne({
                where: {
                    number_id: req.body.content[i].number_id,
                    meeting_id: meeting.id,
                    user_id: req.decoded.id
                }
            }).then(subContent => {
                if (!subContent) {
                    SubContent.create({
                        number_id: req.body.content[i].number_id,
                        author: req.body.content[i].author,
                        content: req.body.content[i].content,
                        start_time: req.body.content[i].start_time,
                        end_time: req.body.content[i].end_time,
                        user_id: req.decoded.id,
                        meeting_id: req.params.meetingId
                    }).then(newSubContent => {
                        subContents.push(newSubContent);
                    });
                }
            });
        }
        setTimeout(() => {
            if (subContents.length === 0) {
                return res.json({'status': false, 'data': 'No new number_id to add'});
            }
            return res.json({ 'status': true, 'data': subContents});
        }, 1000);
    });
});

router.put('/:meetingId', Authorization.isEditerOrOwnerMeeting, (req, res) => {
    Meeting.findById(req.params.meetingId).then(meeting => {
        if (!meeting) {
            return res.json({ 'status': false, 'data': 'There is no Meeting like that'});
        }
        var errors = [];
        var subContents = [];
        for (var i = 0; i < req.body.content.length; i++) {
            var { error } = validateSubContent(req.body.content[i]);
            if (error) {
                errors.push('\n Error in number_id: ' + req.body.content[i].number_id + ' --- Message: ' + error.details[0].message);
            }
        }
        if (errors.length !== 0) {
            return res.json({'status': false, 'data': errors});
        }
        for (let i = 0; i < req.body.content.length; i++) {
            SubContent.findOne({
                where: {
                    number_id: req.body.content[i].number_id
                }
            }).then(subContent => {
                if (subContent) {
                    subContent.update({
                        author: req.body.content[i].author,
                        content: req.body.content[i].content,
                        start_time: req.body.content[i].start_time,
                        end_time: req.body.content[i].end_time
                    }).then(updatedSubContent => {
                        subContents.push(updatedSubContent);
                    });
                }
            });
        }
        setTimeout(() => {
            if (subContents.length === 0) {
                return res.json({'status': false, 'data': 'No Sub Content is update'});
            }
            return res.json({ 'status': true, 'data': subContents});
        }, 1000);
    });
});

router.delete('/:meetingId/:subContentId', (req, res) => {
    Meeting.findById(req.params.meetingId).then(meeting => {
        if (!meeting) {
            return res.json({ 'status': false, 'data': 'There is no Meeting like that'});
        }
        SubContent.findById(req.params.subContentId).then(subContent => {
            if (!subContent) {
                return res.json({ 'status': false, 'data': 'This is no SubContent available to delete'});
            }
            subContent.destroy();
            return res.json({ 'status': true, 'data': subContent });
        });
    });
});

function validateSubContent(subContent) {
    const schema = Joi.object().keys({
        number_id: Joi.number().required(),
        author: Joi.string().required(),
        content: Joi.string().required(),
        start_time: Joi.string().required(),
        end_time: Joi.string().required()
    });
    return Joi.validate(subContent, schema);
}
module.exports = router;
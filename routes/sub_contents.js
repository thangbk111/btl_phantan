const Joi = require('joi');
const express = require('express');
const router = express.Router();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
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
    var userId = req.decoded.id;
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
            // Find record has same Author, StartTime, EndTime
            SubContent.findOne({
                where: {
                    author: req.body.content[i].author,
                    start_time: req.body.content[i].start_time,
                    end_time: req.body.content[i].end_time,
                    user_id: {
                        [Op.ne]: userId
                    }
                }
            }).then(sameSubContent => {
                if (sameSubContent) {
                    // If record has Same Content
                    if (sameSubContent.content.trim() === req.body.content[i].content.trim()) {
                        sameSubContent.update({
                            user_id: userId
                        }).then(updatedSubContent => {
                            subContents.push(updatedSubContent);
                        });
                    } else { // Conflict if content different
                        var conflictContent = '<b>Conflict Content</b><br/>'
                                              + '<font color="red">' + sameSubContent.content.trim() + '<font/><br/>'
                                              + '<font color="blue">' + req.body.content[i].content.trim() + '<font/><br/>';
                        sameSubContent.update({
                            content: conflictContent,
                            user_id: userId
                        }).then(updatedSubContent => {
                            subContents.push(updatedSubContent);
                        });
                    }
                } else {
                    SubContent.findOne({
                        where: {
                            number_id: req.body.content[i].number_id,
                            meeting_id: meeting.id,
                            user_id: userId
                        }
                    }).then(subContent => {
                        // SubContent do not exist ===> Create
                        if (!subContent) {
                            SubContent.create({
                                number_id: req.body.content[i].number_id,
                                author: req.body.content[i].author,
                                content: req.body.content[i].content,
                                start_time: req.body.content[i].start_time,
                                end_time: req.body.content[i].end_time,
                                user_id: userId,
                                meeting_id: req.params.meetingId
                            }).then(newSubContent => {
                                subContents.push(newSubContent);
                            });
                        } else {
                            // SubContent exist ===> Update
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
            });
        }
        setTimeout(() => {
            if (subContents.length === 0) {
                return res.json({'status': false, 'data': 'subcontent does not add or update'});
            }
            return res.json({ 'status': true, 'data': subContents});
        }, 1000);
    });
});

//Update all content
router.put('/:meetingId/:subContentId', Authorization.isEditerOrOwnerMeeting, (req, res) => {
    Meeting.findById(req.params.meetingId).then(meeting => {
        if (!meeting) {
            return res.json({ 'status': false, 'data': 'There is no Meeting like that'});
        }
        SubContent.findById(req.params.subContentId).then(subContent => {
            if (!subContent) {
                return res.json({ 'status': false, 'data': 'This is no SubContent available to update'});
            }
            subContent.update({
                author: req.body.author,
                content: req.body.content,
                start_time: req.body.start_time,
                end_time: req.body.end_time
            });
            return res.json({ 'status': true, 'data': subContent });
        });
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
const Joi = require('joi');
const express = require('express');
const router = express.Router();
var Meeting = require('../models/meeting');
var Role = require('../models/role');
var Authorization = require('../middleware/authorization');

router.get('/', (req, res) => {
    Role.findAll({
        where: {
            user_id: req.decoded.id
        }
    }).then(roles => {
        var meetingIds = [];
        for (let i = 0; i < roles.length; i++) {
            meetingIds.push(roles[i].dataValues.meeting_id);
        }
        Meeting.findAll({ where: {id: meetingIds} }).then(meetings => {
            res.json({ 'status': true, 'data': meetings});
        });
    });
});

router.post('/', (req, res) => {
    var { error } = validateMeeting(req.body);
    if (error) {
        res.json({ 'status': false, 'data': error.details[0].message});
    } else{
        Meeting.create({
            title: req.body.title,
            user_created_id: req.decoded.id
        }).then(newMeeting => {
            Role.create({
                role: Authorization.OWNER,
                user_id: req.decoded.id,
                meeting_id: newMeeting.id
            });
            res.json({ 'status': true, 'data': newMeeting});
        });
    }
})

router.put('/:meetingId', Authorization.isOwnerMeeting, (req, res) => {
    Meeting.findById(req.params.meetingId).then(meeting => {
        if (!meeting) {
            return res.status(404).json({'status': false, 'data': 'The is no meeting available'});
        }
        var { error } = validateMeeting(req.body);
        if (error) {
            return res.json({'status': false, 'data': error.details[0].message});
        }
        meeting.update({
            title: req.body.title
        });
        return res.json({'status': true, 'data': meeting});
    });
});

router.delete('/:meetingId', Authorization.isOwnerMeeting, (req, res) => {
    Meeting.findById(req.params.meetingId).then(meeting => {
        if (!meeting) {
            return res.status(404).json({'status': false, 'data': 'The is no meeting available for delete'});
        }
        meeting.destroy();
        Role.destroy({
            where: {
                meeting_id: meeting.id
            }
        });
        return res.json({'status': true, 'data': meeting});
    });
});

function validateMeeting(meeting) {
    const schema = Joi.object().keys({
        title: Joi.string().required(),
    });
    return Joi.validate(meeting, schema);
}
module.exports = router;
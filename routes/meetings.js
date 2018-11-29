const Joi = require('joi');
const express = require('express');
const router = express.Router();
var Meeting = require('../models/meeting');
var Role = require('../models/role');
var Authorization = require('../middleware/authorization');
var User = require('../models/user');

router.get('/', (req, res) => {
    Role.findAll({
        where: {
            user_id: req.decoded.id
        }
    }).then( async roles => {
        var result = [];
        var meetingIds = [];
        for (let i = 0; i < roles.length; i++) {
            meetingIds.push(roles[i].dataValues.meeting_id);
        }
        meetings = await Meeting.findAll({ where: {id: meetingIds} });
        for (let i in meetings) {
            let meeting = meetings[i];
            let id = meeting.user_created_id;
            let name = await User.find({ where: { id: id} });
            // console.log(name);
            var data = {
                "id" : meeting["id"],
                "title": meeting["title"],
                "created_at": meeting["created_at"],
                "updated_at": meeting["updated_at"],
                "user_created_id": meeting["user_created_id"],
                "user_name" : name["name"]
            };

            console.log(data)
            result.push(data);
        }
        res.json({'status': true, 'data': result});
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
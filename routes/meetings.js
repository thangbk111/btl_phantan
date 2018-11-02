const Joi = require('joi');
const express = require('express');
const router = express.Router();
var Meeting = require('../models/meeting');

router.get('/', (req, res) => {
    Meeting.all().then(meetings => {
        res.json({ 'success': true, 'data': meetings});
    });
});

router.post('/', (req, res) => {
    var { error } = validateMeeting(req.body);
    if (error) {
        res.json({ 'error': true, 'message': error.details[0].message});
    } else{
        Meeting.create({
            title: req.body.title,
            user_created_id: 1 // Chưa có session, để default là thằng số 1 tạo ra cuộc Meeting
        }).then(newMeeting => {
            res.json({ 'success': true, 'data': newMeeting});
        });
    }
})

router.put('/:id', (req, res) => {
    Meeting.findById(req.params.id).then(meeting => {
        if (!meeting) {
            return res.status(404).json({'error': true, 'message': 'The is no meeting available'});
        }
        var { error } = validateMeeting(req.body);
        if (error) {
            return res.json({'error': true, 'message': error.details[0].message});
        }
        meeting.update({
            title: req.body.title
        });
        return res.json({'success': true, 'data': meeting});
    });
});

router.delete('/:id', (req, res) => {
    Meeting.findById(req.params.id).then(meeting => {
        if (!meeting) {
            return res.status(404).json({'error': true, 'message': 'The is no meeting available for delete'});
        }
        meeting.destroy();
        return res.json({'success': true, 'data': meeting});
    });
});

function validateMeeting(meeting) {
    const schema = Joi.object().keys({
        title: Joi.string().required(),
    });
    return Joi.validate(meeting, schema);
}
module.exports = router;
const Joi = require('joi');
const express = require('express');
const router = express.Router();
var Authorization = require('../middleware/authorization');
var Role = require('../models/role');
var User = require('../models/user');

/* Nhap Email để mời thêm người vào 1 cuộc họp
*/
router.post('/:meetingId', Authorization.isEditerOrOwnerMeeting, (req, res) => {
    var userEmail = req.body.email;
    var userRole = req.body.role;
    var {error} = validateInvitation(req.body);
    if (error) {
        return res.json({'status': false, 'data': error.details[0].message});
    }
    if ((userRole !== Authorization.VIEWER) && (userRole !== Authorization.EDITER)) {
        return res.json({ 'status': false, 'data': 'Role is only set value 0-Viewer or 1-Editor'});
    }
    User.findOne({ where: {email: userEmail} }).then(user => {
        if (!user) {
            return res.json({ 'status': false, 'data': 'Email has not exist'});
        }
        // Add User_id to Roles Table
        Role.create({
            role: userRole,
            user_id: user.id,
            meeting_id: req.params.meetingId
        }).then(role => {
            return res.json({'status': true, 'data': role});
        });
    });
});

function validateInvitation(invitation) {
    const schema = Joi.object().keys({
        email: Joi.string().required(),
        role: Joi.number().required()
    });
    return Joi.validate(invitation, schema);
}
module.exports = router;
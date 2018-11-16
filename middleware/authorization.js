const Role = require('../models/role');

var Authorization =  {
    VIEWER: 0,
    EDITER: 1,
    OWNER: 2
};

Authorization.isViewer = function(req, res, next) {
    var meeting_id = req.params.meetingId;
    var user_id =  req.decoded.id;
    Role.findOne({
        where: {
            user_id: user_id,
            meeting_id: meeting_id
        }
    }).then(user => {
        if (!user) {
            return res.json({'status': false, 'data': 'You not invited to the Meeting'});
        }
        //Check Role
        switch (user.role) {
            case Authorization.OWNER:
            case Authorization.EDITER:
            case Authorization.VIEWER:
                next();
                break;
            default:
                return res.json({'status': false, 'data': 'You do not have premission in Meeting'});
        }
    });
}

Authorization.isEditerOrOwnerMeeting =  function(req, res, next) {
    var meeting_id = (req.params.meetingId === null) ? null : req.params.meetingId;
    var user_id =  req.decoded.id;
    Role.findOne({
        where: {
            user_id: user_id,
            meeting_id: meeting_id
        }
    }).then(user => {
        if (!user) {
            return res.json({'status': false, 'data': 'You are not invited to the Meeting'});
        }
        switch (user.role) {
            case Authorization.EDITER:
            case Authorization.OWNER:
                next();
                break;
            default:
                return res.json({'status': false, 'data': 'You do not have premission in Meeting'});
        }
    });
};

Authorization.isOwnerMeeting =  function(req, res, next) {
    var meeting_id = req.params.meetingId;
    var user_id =  req.decoded.id;
    Role.findOne({
        where: {
            user_id: user_id,
            meeting_id: meeting_id
        }
    }).then(user => {
        console.log(user);
        if (!user) {
            return res.json({'status': false, 'data': 'You are not owner to the Meeting'});
        }
        switch (user.role) {
            case Authorization.OWNER:
                next();
                break;
            default:
                return res.json({'status': false, 'data': 'You do not have premission in Meeting'});
        }
    });
};

module.exports = Authorization;
const Joi = require('joi');
const express = require('express');
const router = express.Router();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
var SubContent = require('../models/sub_content');
var Meeting = require('../models/meeting');
var Authorization = require('../middleware/authorization');

const TYPE_FILE1 = 0; // {'author', 'start_time', 'end_time'}
const TYPE_FILE2 = 1; // {start_time', 'end_time', 'content'}
const TYPE_FILE3 = 2; // {'author', 'start_time', 'end_time', 'content'}
const CONFLICT = 1;
const NO_CONFLICT = 0;
const FIXED_CONFLICT = 2;
const FULL = 1;
const MISSING = 0;

/*****************************SOCKET
 * ***************************
 * ***************************
 *****************************/

var io = require('../sockets/socket_server').createSocket();
/*
Client Emit ===> 
{
    "user_id"
    "meeting_id"
    "subcontent": {
        "id"
        "author"
        "content"
        "start_time"
        "end_time"
    }
} 
*/
io.on('connection', (socket) => {
    // Update and Add Channel
    socket.on('edit_subcontent', function(data) {
        if(!checkRole(Authorization.getUserRole(data.user_id, data.meeting_id))) {
            io.emit('edit_subcontent', { 'status': false, 'data': 'user has not access to edit'});
        }else{
            if (data.subcontent.id === 0 ){
                var {error} = validateTypeFile3(data.subcontent);
                if (error) {
                    io.emit('edit_subcontent', { 'status': false, 'data': error});
                } else {
                    SubContent.findOne({
                        where: {
                            'start_time': data.subcontent.start_time,
                            'end_time': data.subcontent.end_time,
                            'author': data.subcontent.author,
                            'is_full': FULL
                        }
                    }).then(subcontent => {
                        if (!subcontent) {
                            SubContent.create({
                                author: data.subcontent.author,
                                content: data.subcontent.content,
                                start_time: data.subcontent.start_time,
                                end_time: data.subcontent.end_time,
                                is_full: FULL,
                                flag: FIXED_CONFLICT,
                                user_id: data.user_id,
                                meeting_id: data.meeting_id
                            }).then(newSubContent => {
                                io.emit('edit_subcontent', { 'status': true, 'data': newSubContent });
                            });
                        }
                    });
                }
            } else {
                SubContent.findById(data.subcontent.id).then(subContent => {
                    if (!subContent) {
                        io.emit('edit_subcontent', { 'status': false, 'data': 'This is no SubContent available to update'});
                    } else {
                        subContent.update({
                            author: data.subcontent.author,
                            content: data.subcontent.content,
                            flag: FIXED_CONFLICT
                        }).then(subcontentUpdated => {
                            io.emit('edit_subcontent', { 'status': true, 'data': subContent });
                        });
                    }
                });
            }
        }
    });

    // Delete Channel
    socket.on('delete_subcontent', function(data) {
        if(!checkRole(Authorization.getUserRole(data.user_id, data.meeting_id))) {
            io.emit('edit_subcontent', { 'status': false, 'data': 'user has not access to edit'});
        }else{
            SubContent.findById(data.subcontent.id).then(subContent => {
                if (!subContent) {
                    io.emit('delete_subcontent', { 'status': false, 'data': 'This is no SubContent available to delete'});
                }
                subContent.destroy();
                io.emit('delete_subcontent', { 'status': true, 'data': subContent });
            });
        }
    });
});

function checkRole(role) {
    if(role === Authorization.VIEWER) {
        return 0;
    }
    return 1;
}

function validateTypeFile3(content) {
    schema = Joi.object().keys({
        author: Joi.string().required(),
        content: Joi.string().required(),
        start_time: Joi.date().iso().less(Joi.ref('end_time')).required(),
        end_time: Joi.date().iso().greater(Joi.ref('start_time')).required()
    });
    return Joi.validate(content, schema);
}

/********************* REST API
********************************* 
***********************/

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
    const userId = req.decoded.id;
    const meetingId = req.params.meetingId;
    var contents = req.body.content;
    var flagConfict = false;
    Meeting.findById(meetingId).then(meeting => {
        if (!meeting) {
            return res.json({ 'status': false, 'data': 'There is no Meeting like that'});
        }
    });

    // TYPE_FILE1
    if (req.body.type === TYPE_FILE1) {
        var errors = validateContentFile(contents, TYPE_FILE1);
        if (errors.length !== 0) {
            return res.json({'status': false, 'data': errors});
        }
        for(let i = 0; i < contents.length; i++) {
            contents[i].userId = userId;
            contents[i].meetingId = meetingId;
            SubContent.findAll({
                where: {
                    'start_time': contents[i].start_time,
                    'end_time': contents[i].end_time,
                    'flag': {
                        [Op.ne]: FIXED_CONFLICT  // !== FIXED_CONFLICT
                    }
                }
            }).then(subcontents => {
                if (subcontents.length === 0) {
                    var newSubContent = createNewSubContent(TYPE_FILE1, contents[i], NO_CONFLICT, MISSING);
                    io.emit('add_subcontent', newSubContent);
                }
                else if (subcontents.length === 1) {
                    //CASE: No Conflict. MISSING author ==> Update
                    if (subcontents[0].flag === NO_CONFLICT && subcontents[0].is_full === MISSING && subcontents[0].author === null) {
                        subcontents[0].update({
                            author: contents[i].author,
                            is_full: FULL
                        }).then(subcontentUpdated => {
                            io.emit('update_subcontent', subcontentUpdated);
                        });
                    }
                    //CASE: Conflict Author
                    if (subcontents[0].author !== contents[i].author) {
                        flagConfict = true;
                        subcontents[0].update({
                            flag: CONFLICT
                        }).then(subcontentUpdated => {
                            io.emit('update_subcontent', subcontentUpdated);
                        });
                        var newSubContent = createNewSubContent(TYPE_FILE1, contents[i], CONFLICT, MISSING);
                        io.emit('add_subcontent', newSubContent);
                    }
                }
                else {
                    var authors = [];
                    subcontents.forEach((subcontent) => {
                        authors.push(subcontent.author);
                    });
                    //Conflict Author
                    if (authors.indexOf(contents[i].author) === -1) {
                        flagConfict = true;
                        var newSubContent = createNewSubContent(TYPE_FILE1, contents[i], CONFLICT, MISSING);
                        io.emit('add_subcontent', newSubContent);
                    }
                }
            });
        }
        setTimeout(() => {
            if (flagConfict === true) {
                return res.json({'status': false, 'data': 'Data has conflict'});
            }else {
                return res.json({'status': true, 'data': 'Data was added successfull'});
            }
        }, 1000);
    }
    // TYPE_FILE2
    if (req.body.type === TYPE_FILE2) {
        var errors = validateContentFile(contents, TYPE_FILE2);
        if (errors.length !== 0) {
            return res.json({'status': false, 'data': errors});
        }
        for (let i = 0; i < contents.length; i++) {
            contents[i].userId = userId;
            contents[i].meetingId = meetingId;
            SubContent.findOne({
                where: {
                    'start_time': contents[i].start_time,
                    'end_time': contents[i].end_time,
                    'flag': {
                        [Op.ne]: FIXED_CONFLICT  // !== FIXED_CONFLICT
                    }
                }
            }).then(subcontent => {
                if (!subcontent) {
                    var newSubContent = createNewSubContent(TYPE_FILE2, contents[i], NO_CONFLICT, MISSING);
                    io.emit('add_subcontent', newSubContent);
                } else {
                    //CASE: MISSING CONTENT ===> Update
                    if (subcontent.is_full === MISSING && subcontent.content === null && subcontent.flag === NO_CONFLICT) {
                        subcontent.update({
                            content: contents[i].content,
                            is_full: FULL
                        }).then(subcontentUpdated => {
                            io.emit('update_subcontent', subcontentUpdated);
                        });
                    } else {
                        var newSubContent = createNewSubContent(TYPE_FILE2, contents[i], NO_CONFLICT, MISSING);
                        io.emit('add_subcontent', newSubContent);
                    }
                }
            });
        }
        return res.json({'status': true, 'data': 'Data was added successfull'});
    }
    //TYPE 3
    // if (req.body.type === TYPE_FILE3) {
    //     var errors = validateContentFile(contents, TYPE_FILE3);
    //     if (errors.length !== 0) {
    //         return res.json({'status': false, 'data': errors});
    //     }
    //     for (let i = 0; i < contents.length; i++) {
    //         contents[i].userId = userId;
    //         contents[i].meetingId = meetingId;
    //         SubContent.findOne({
    //             where: {
    //                 'start_time': contents[i].start_time,
    //                 'end_time': contents[i].end_time,
    //                 'author': contents[i].author,
    //                 'is_full': FULL
    //             }
    //         }).then(subcontent => {
    //             if (!subcontent) {
    //                 var newSubContent = createNewSubContent(TYPE_FILE3, contents[i], FIXED_CONFLICT, FULL);
    //                 io.emit('add_subcontent', newSubContent);
    //             }
    //         });
    //     }
    //     return res.json({'status': true, 'data': 'Data was added successfull'});
    // }
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

function validateContentFile(contents, typeFile) {
    var errors = [];
    var schema;
    if (typeFile === TYPE_FILE1) {
        schema = Joi.object().keys({
            author: Joi.string().required(),
            start_time: Joi.date().iso().less(Joi.ref('end_time')).required(),
            end_time: Joi.date().iso().greater(Joi.ref('start_time')).required()
        });
    }
    if (typeFile === TYPE_FILE2) {
        schema = Joi.object().keys({
            content: Joi.string().required(),
            start_time: Joi.date().iso().less(Joi.ref('end_time')).required(),
            end_time: Joi.date().iso().greater(Joi.ref('start_time')).required()
        });
    }
    if (typeFile === TYPE_FILE3) {
        schema = Joi.object().keys({
            author: Joi.string().required(),
            content: Joi.string().required(),
            start_time: Joi.date().iso().less(Joi.ref('end_time')).required(),
            end_time: Joi.date().iso().greater(Joi.ref('start_time')).required()
        });
    }
    for(var i = 0; i <= contents.length; i++) {
        var {error} = Joi.validate(contents[i], schema);
        if (error != null) {
            errors.push('content'+(i+1) +'---' + error.details[0].message);
        }
    }
    return errors;
}

function createNewSubContent(typeFile, _content, flag, isFull) {
    if (typeFile === TYPE_FILE1) {
        SubContent.create({
            author: _content.author,
            start_time: _content.start_time,
            end_time: _content.end_time,
            is_full: isFull,
            flag: flag,
            user_id: _content.userId,
            meeting_id: _content.meetingId
        }).then(subcontent => {
            return subcontent;
        });
    }
    if (typeFile === TYPE_FILE2) {
        SubContent.create({
            content: _content.content,
            start_time: _content.start_time,
            end_time: _content.end_time,
            is_full: isFull,
            flag: flag,
            user_id: _content.userId,
            meeting_id: _content.meetingId
        }).then(subcontent => {
            return subcontent;
        });
    }
    if (typeFile === TYPE_FILE3) {
        SubContent.create({
            author: _content.author,
            content: _content.content,
            start_time: _content.start_time,
            end_time: _content.end_time,
            is_full: isFull,
            flag: flag,
            user_id: _content.userId,
            meeting_id: _content.meetingId
        }).then(subcontent => {
            return subcontent;
        });
    }
}

module.exports = router;
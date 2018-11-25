const express = require('express');
const Joi = require('joi');
const bodyParser = require('body-parser');
const session = require('express-session');
const morgan = require('morgan');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
var users = require('./routes/users');
var meetings = require('./routes/meetings');
var roles = require('./routes/roles');
var histories = require('./routes/histories');
var subContents = require('./routes/sub_contents');
var SubContent = require('./models/sub_content');
var isAuthenticated = require('./middleware/authenticate');
var Authorization = require('./middleware/authorization');
var historyController = require('./controller/history_controller');

const TYPE_FILE1 = 0; // {'author', 'start_time', 'end_time'}
const TYPE_FILE2 = 1; // {start_time', 'end_time', 'content'}
const TYPE_FILE3 = 2; // {'author', 'start_time', 'end_time', 'content'}
const CONFLICT = 1;
const NO_CONFLICT = 0;
const FIXED_CONFLICT = 2;
const FULL = 1;
const MISSING = 0;

const app = express();
var socketServer = require('http').createServer();
var io = require('socket.io')(socketServer);

io.on('connection', (socket) => {
/*
{
    "user_id":,
    "meeting_id",
    "content": [
        {
            "author": "Thang",
            "start_time": "2018-11-21 12:51:00",
            "end_time": "2018-11-21 12:51:45"
        },
        {
            "author": "D. Quan",
            "start_time": "2018-11-21 12:52:00",
            "end_time": "2018-11-21 12:53:05"
        }
    ],
    "type": 0,1,2
}
*/

    // Add channel
    socket.on('add_subcontent', function(data) {
        console.log('----------------------------------');
        console.log(data);
        if(!checkRole(Authorization.getUserRole(data.user_id, data.meeting_id))) {
            io.emit('add_subcontent', { 'status': false, 'data': 'user has not access to edit'});
        }else {
            /*****************TYPE FILE 1 {'author', 'start_time', 'end_time'} ****************** */
            if (data.type === TYPE_FILE1) {
                var contents = data.contents;
                var userId = data.user_id;
                var meetingId = data.meeting_id;
                var errors = validateContentFile(contents, TYPE_FILE1);
                if (errors.length !== 0) {
                    console.log('errrrrrrrrrrorrrrrr');
                    io.emit('add_subcontent', {'status': false, 'data': errors});
                } else {
                    console.log('Noooooooooooooooooo.................errrrrrrrrrrorrrrrr');
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
                                console.log('create newwwwwwwwwwwwwwwwwwwwww');
                                var newSubContent = createNewSubContent(TYPE_FILE1, contents[i], NO_CONFLICT, MISSING);
                                io.emit('add_subcontent', {'status': true, 'data': newSubContent});
                            }
                            else if (subcontents.length === 1) {
                                //CASE: No Conflict. MISSING author ==> Update
                                if (subcontents[0].flag === NO_CONFLICT && subcontents[0].is_full === MISSING && subcontents[0].author === null) {
                                    subcontents[0].update({
                                        author: contents[i].author,
                                        is_full: FULL
                                    }).then(subContentUpdated => {
                                        io.emit('add_subcontent', {'status': true, 'data': subContentUpdated});
                                        historyController.createHistory(subContentUpdated.id,'update', 'author', '', subContentUpdated.author, userId);
                                    });
                                }
                                //CASE: Conflict Author
                                if (subcontents[0].author !== contents[i].author) {
                                    subcontents[0].update({
                                        flag: CONFLICT
                                    }).then(subContentUpdated => {
                                        io.emit('add_subcontent', {'status': true, 'data': subContentUpdated});
                                    });
                                    var newSubContent = createNewSubContent(TYPE_FILE1, contents[i], CONFLICT, MISSING);
                                    io.emit('add_subcontent', {'status': true, 'data': newSubContent});
                                }
                            }
                            else {
                                var authors = [];
                                subcontents.forEach((subcontent) => {
                                    authors.push(subcontent.author);
                                });
                                //Conflict Author
                                if (authors.indexOf(contents[i].author) === -1) {
                                    var newSubContent = createNewSubContent(TYPE_FILE1, contents[i], CONFLICT, MISSING);
                                    io.emit('add_subcontent', {'status': true, 'data': newSubContent});
                                }
                            }
                        });
                    }
                }
            }

            // /*****************TYPE FILE 2 {start_time', 'end_time', 'content'} ****************** */
            // if (data.type === TYPE_FILE2) {
            //     var contents = data.contents;
            //     var errors = validateContentFile(contents, TYPE_FILE2);
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
            //                 'flag': {
            //                     [Op.ne]: FIXED_CONFLICT  // !== FIXED_CONFLICT
            //                 }
            //             }
            //         }).then(subcontent => {
            //             if (!subcontent) {
            //                 var newSubContent = createNewSubContent(TYPE_FILE2, contents[i], NO_CONFLICT, MISSING);
            //                 io.emit('add_subcontent', {'status': true, 'data': newSubContent});
            //             } else {
            //                 //CASE: MISSING CONTENT ===> Update
            //                 if (subcontent.is_full === MISSING && subcontent.content === null && subcontent.flag === NO_CONFLICT) {
            //                     subcontent.update({
            //                         content: contents[i].content,
            //                         is_full: FULL
            //                     }).then(subContentUpdated => {
            //                         io.emit('add_subcontent', {'status': true, 'data': subContentUpdated});
            //                         historyController.createHistory(subContentUpdated.id,'update', 'content', '', subContentUpdated.content, userId);
            //                     });
            //                 } else {
            //                     var newSubContent = createNewSubContent(TYPE_FILE2, contents[i], NO_CONFLICT, MISSING);
            //                     io.emit('add_subcontent', {'status': true, 'data': newSubContent});
            //                 }
            //             }
            //         });
            //     }
            // }

            // /*****************TYPE FILE 3 {'author', 'start_time', 'end_time', 'content'} ****************** */
            // if (req.body.type === TYPE_FILE3) {
            //     var contents = data.contents;
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
            //                 io.emit('add_subcontent', {'status': true, 'data': newSubContent});
            //             }
            //         });
            //     }
            // }
        }
    });

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
    // Update Channel
    socket.on('edit_subcontent', function(data) {
        if(!checkRole(Authorization.getUserRole(data.user_id, data.meeting_id))) {
            io.emit('edit_subcontent', { 'status': false, 'data': 'user has not access to edit'});
        }else{
            SubContent.findById(data.subcontent.id).then(subContent => {
                if (!subContent) {
                    io.emit('edit_subcontent', { 'status': false, 'data': 'This is no SubContent available to update'});
                } else {
                    var oldAuthor = subContent.author;
                    var oldContent = subContent.content;
                    subContent.update({
                        author: data.subcontent.author,
                        content: data.subcontent.content,
                        flag: FIXED_CONFLICT
                    }).then(subContentUpdated => {
                        if (subContentUpdated.author !== oldAuthor) {
                            historyController.createHistory(subContentUpdated.id,'update', 'author', oldAuthor, subContentUpdated.author, data.user_id);
                        }
                        if (subContentUpdated.content !== oldContent) {
                            historyController.createHistory(subContentUpdated.id,'update', 'content', oldContent, subContentUpdated.content, data.user_id);
                        }
                        io.emit('edit_subcontent', { 'status': true, 'data': subContent });
                    });
                }
            });
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
                } else {
                    historyController.createHistory(subContent.id,'delete', 'author', subContent.author, '', data.user_id);
                    historyController.createHistory(subContent.id,'delete', 'content', subContent.content, '', data.user_id);
                    historyController.createHistory(subContent.id,'delete', 'start_time', subContent.start_time, '', data.user_id);
                    historyController.createHistory(subContent.id,'delete', 'end_time', subContent.end_time, '', data.user_id);
                    subContent.destroy();
                    io.emit('delete_subcontent', { 'status': true, 'data': subContent });
                }
            });
        }
    });
});

//Configs
app.set('port', 3000);

//Use Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));

// Route
app.use('/api/users', users);
app.use('/api/meetings',isAuthenticated, meetings);
app.use('/api/sub_contents', isAuthenticated, subContents);
app.use('/api/invite_meeting', isAuthenticated, roles);
app.use('/api/histories', isAuthenticated, histories);

socketServer.listen(8080, () => console.log('Socket Server listening port 8080'));
app.listen(app.get('port'), () => console.log(`Listening to port ${app.get('port')}`));

function checkRole(role) {
    if(role === Authorization.VIEWER) {
        return 0;
    }
    return 1;
}

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
    for(var i = 0; i < contents.length; i++) {
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
        }).then(newSubContent => {
            historyController.createHistory(newSubContent.id,'insert', 'author', newSubContent.author, newSubContent.author, _content.userId);
            return newSubContent;
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
        }).then(newSubContent => {
            historyController.createHistory(newSubContent.id,'insert', 'content', subContent.content, subContent.content, _content.userId);
            return newSubContent;
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
        }).then(newSubContent => {
            historyController.createHistory(newSubContent.id,'insert', 'author', subContent.author, subContent.author, _content.userId);
            historyController.createHistory(newSubContent.id,'insert', 'content', subContent.content, subContent.content, _content.userId);
            return newSubContent;
        });
    }
}
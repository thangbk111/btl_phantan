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
    //Add channel
    socket.on('add_subcontent', function() {
        io.emit('add_subcontent');
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
                                historyController.createHistory(data.meeting_id, newSubContent.id,'insert', 'author', newSubContent.author, newSubContent.author, data.user_id);
                                historyController.createHistory(data.meeting_id, newSubContent.id,'insert', newSubContent.content, newSubContent.content, data.user_id);
                            });
                        }
                    });
                }
            } else {
                SubContent.findById(data.subcontent.id).then(subContent => {
                    if (!subContent) {
                        io.emit('edit_subcontent', { 'status': false, 'data': 'This is no SubContent available to update'});
                    } else {
                        var oldAuthor = subContent.author;
                        var oldContent = subContent.content;
                        subContent.update({
                            author: data.subcontent.author,
                            content: data.subcontent.content,
                            flag: FIXED_CONFLICT,
                            is_full: FULL
                        }).then(subContentUpdated => {
                            if (subContentUpdated.author !== oldAuthor) {
                                historyController.createHistory(data.meeting_id, subContentUpdated.id,'update', 'author', oldAuthor, subContentUpdated.author, data.user_id);
                            }
                            if (subContentUpdated.content !== oldContent) {
                                historyController.createHistory(data.meeting_id, subContentUpdated.id,'update', 'content', oldContent, subContentUpdated.content, data.user_id);
                            }
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
                } else {
                    historyController.createHistory(data.meeting_id, subContent.id,'delete', 'author', subContent.author, '', data.user_id);
                    historyController.createHistory(data.meeting_id, subContent.id,'delete', 'content', subContent.content, '', data.user_id);
                    historyController.createHistory(data.meeting_id, subContent.id,'delete', 'start_time', subContent.start_time, '', data.user_id);
                    historyController.createHistory(data.meeting_id, subContent.id,'delete', 'end_time', subContent.end_time, '', data.user_id);
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

function validateTypeFile3(content) {
    schema = Joi.object().keys({
        id: Joi.number().required(),
        author: Joi.string().required(),
        content: Joi.string().required(),
        start_time: Joi.date().less(Joi.ref('end_time')).required(),
        end_time: Joi.date().greater(Joi.ref('start_time')).required()
    });
    return Joi.validate(content, schema);
}
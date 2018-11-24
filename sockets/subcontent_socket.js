var Authorization = require('../middleware/authorization');
var SubContent = require('../models/sub_content');
var RouterSubContent = require('../routes/sub_contents');
const Joi = require('joi');
const TYPE_FILE1 = 0; // {'author', 'start_time', 'end_time'}
const TYPE_FILE2 = 1; // {start_time', 'end_time', 'content'}
const TYPE_FILE3 = 2; // {'author', 'start_time', 'end_time', 'content'}
const CONFLICT = 1;
const NO_CONFLICT = 0;
const FIXED_CONFLICT = 2;
const FULL = 1;
const MISSING = 0;

var SubContentSocket = {
    edit_subcontent: function(data) {
        if(!checkRole(Authorization.getUserRole(data.user_id, data.meeting_id))) {
            io.emit('edit_subcontent', { 'status': false, 'data': 'user has not access to edit'});
        }else{
            if (data.subcontent.id === 0 ){
                var {error} = validateTypeFile3(data.subcontent);
                if (error) {
                    //return res.json({'status': false, 'data': error});
                    io.emit('edit_subcontent', { 'status': false, 'data': error});
                } else {
                    SubContent.findOne({
                        where: {
                            'start_time': contents[i].start_time,
                            'end_time': contents[i].end_time,
                            'author': contents[i].author,
                            'is_full': FULL
                        }
                    }).then(subcontent => {
                        if (!subcontent) {
                            RouterSubContent.createNewSubContent(TYPE_FILE3, contents[i], FIXED_CONFLICT, FULL);
                            io.emit('edit_subcontent', { 'status': true, 'data': "add content successfull" });
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
                        });
                        io.emit('edit_subcontent', { 'status': true, 'data': subContent });
                    }
                });
            }
        }
    },
    delete_subcontent: function(data) {
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
    }
}

SubContent.checkRole = function(role) {
    if(role === Authorization.VIEWER) {
        return 0;
    }
    return 1;
}

SubContent.validateTypeFile3 = function(content) {
    schema = Joi.object().keys({
        author: Joi.string().required(),
        content: Joi.string().required(),
        start_time: Joi.date().iso().less(Joi.ref('end_time')).required(),
        end_time: Joi.date().iso().greater(Joi.ref('start_time')).required()
    });
    return Joi.validate(content, schema);
}
module.exports = SubContentSocket;
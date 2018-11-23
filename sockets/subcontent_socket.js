var Authorization = require('../middleware/authorization');
var SubContent = require('../models/sub_content');
const FIXED_CONFLICT = 2;

var SubContentSocket = {
    edit_subcontent: function(data) {
        //Authorize
        if(!checkRole(Authorization.getUserRole(data.user_id, data.meeting_id))) {
            io.emit('edit_subcontent', { 'status': false, 'data': 'user has not access to edit'});
        }else{
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
module.exports = SubContentSocket;
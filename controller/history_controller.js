var History = require('../models/history');

var HistoryController = {};

HistoryController.createHistory = function(meetingId, contentId, action, column, oldValue, newValue, userId) {
    History.create({
        meeting_id: meetingId,
        action: action,
        content_id: contentId,
        column: column,
        old_value: oldValue,
        new_value: newValue,
        change_by: userId
    }).then(newHistory => {
        return newHistory;
    });
}

module.exports = HistoryController;
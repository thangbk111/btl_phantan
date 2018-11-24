var History = require('../models/history');

var HistoryController = {};

HistoryController.createHistory = function(contentId, action, column, oldValue, newValue, userId) {
    History.create({
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
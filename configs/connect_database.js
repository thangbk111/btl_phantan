const Sequelize = require('sequelize');
function connectDatabase() {
    //params: database_name, username, password
    return new Sequelize('meeting', 'root', '1', {
        dialect: 'mysql',
        host: '127.0.0.1',
        port: '6006',
        operatorsAliases: false
    });
}
module.exports = connectDatabase;
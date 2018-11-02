const Sequelize = require('sequelize');
function connectDatabase() {
    //params: database_name, username, password
    return new Sequelize('meeting', 'root', '', {
        dialect: 'mysql',
        host: 'localhost',
        port: '3306',
        operatorsAliases: false
    });
}
module.exports = connectDatabase;
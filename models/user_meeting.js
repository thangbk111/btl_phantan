const Sequelize = require('sequelize');
const User = require('./user');
const Meeting = require('./meeting');
// create a sequelize instance with our local postgres database information.
var sequelize = new Sequelize('meeting', 'root', '', {
    dialect: 'mysql',
    host: 'localhost',
    port: '3306',
    operatorsAliases: false
});

var UserMeeting = sequelize.define('user_meeting', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    role: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
}, {
    underscored: true
});
UserMeeting.belongsTo(User);
UserMeeting.belongsTo(Meeting);

// create all the defined tables in the specified database.
sequelize.sync();

// export User model for use in other files.
module.exports = UserMeeting;
const Sequelize = require('sequelize');
const User = require('./user');
// create a sequelize instance with our local postgres database information.
var sequelize = new Sequelize('meeting', 'root', '', {
    dialect: 'mysql',
    host: 'localhost',
    port: '3306',
    operatorsAliases: false
});

var Meeting = sequelize.define('meetings', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    underscored: true
});

Meeting.belongsTo(User, {foreignKey: 'user_created_id'});
// create all the defined tables in the specified database.
sequelize.sync();

// export User model for use in other files.
module.exports = Meeting;
const Sequelize = require('sequelize');
const User = require('./user');
const Meeting = require('./meeting');
const connectDB = require('../configs/connect_database');
const sequelize = connectDB();

var subContent = sequelize.define('sub_contents', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    author: {
        type: Sequelize.STRING,
        allowNull: false
    },
    content: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    start_time: {
        type: Sequelize.STRING,
        allowNull: false
    },
    end_time: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    underscored: true
});

subContent.belongsTo(User);
subContent.belongsTo(Meeting);
// create all the defined tables in the specified database.
sequelize.sync();

// export User model for use in other files.
module.exports = subContent;
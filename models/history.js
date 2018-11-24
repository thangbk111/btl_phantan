const Sequelize = require('sequelize');
const connectDB = require('../configs/connect_database');
const sequelize = connectDB();

var History = sequelize.define('histories', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    action: {
        type: Sequelize.STRING,
        allowNull: false
    },
    content_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    column: {
        type: Sequelize.STRING,
        allowNull: false
    },
    old_value: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    new_value: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    change_by: {
        type: Sequelize.INTEGER, // 0: OK, 1: conflict
        allowNull: false,
    }
}, {
    underscored: true
});

// create all the defined tables in the specified database.
sequelize.sync();

// export User model for use in other files.
module.exports = History;
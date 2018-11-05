const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');
const connectDB = require('../configs/connect_database');
const sequelize = connectDB();

// setup User model and its fields.
var User = sequelize.define('users', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    hooks: {
      beforeCreate: (user) => {
        const salt = bcrypt.genSaltSync();
        user.password = bcrypt.hashSync(user.password, salt);
      }
    },
    instanceMethods: {
      validPassword: function(password) {
        return bcrypt.compareSync(password, this.password);
      }
    }    
}
);

// create all the defined tables in the specified database.
sequelize.sync();

// export User model for use in other files.
module.exports = User;
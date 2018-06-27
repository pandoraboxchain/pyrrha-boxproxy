const Sequelize = require('sequelize');
const db = require('../db');

module.exports = db.define('system', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING,
        unique: true
    },
    value: {
        type: Sequelize.STRING
    }
}, {
    timestamps: false
});

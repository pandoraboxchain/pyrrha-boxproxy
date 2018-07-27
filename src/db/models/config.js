const Sequelize = require('sequelize');
const db = require('../db');

module.exports = db.define('config', {
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
        type: Sequelize.TEXT
    }
}, {
    timestamps: false
});

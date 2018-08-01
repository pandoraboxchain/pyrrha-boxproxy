'use strict';
const Sequelize = require('sequelize');
const db = require('../db');

module.exports = db.define('workers', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    address: {
        type: Sequelize.STRING,
        unique: true
    },
    currentJob: {
        type: Sequelize.STRING
    },
    currentJobStatus: {
        type: Sequelize.INTEGER
    },
    currentState: {
        type: Sequelize.INTEGER
    }
}, {
    timestamps: false
});

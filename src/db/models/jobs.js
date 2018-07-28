'use strict';
const Sequelize = require('sequelize');
const db = require('../db');

module.exports = db.define('jobs', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    address: {
        type: Sequelize.STRING,
        unique: true
    },
    description: {
        type: Sequelize.STRING
    },
    activeWorkers: {
        type: Sequelize.INTEGER
    },
    progress: {
        type: Sequelize.INTEGER
    },
    batches: {
        type: Sequelize.INTEGER,
    },
    kernel: {
        type: Sequelize.STRING,
    },
    dataset: {
        type: Sequelize.STRING,
    },
    ipfsResults: {
        type: Sequelize.STRING,
    },
    state: {
        type: Sequelize.INTEGER,
    },
    jobType: {
        type: Sequelize.STRING
    }    
}, {
    timestamps: false
});

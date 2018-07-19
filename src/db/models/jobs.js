'use strict';
const Sequelize = require('sequelize');
const db = require('../db');

module.exports = db.define('jobs', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    index: {
        type: Sequelize.INTEGER,
    },
    address: {
        type: Sequelize.STRING,
        unique: true
    },
    description: {
        type: Sequelize.STRING
    },
    activeWorkersCount: {
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
    jobStatus: {
        type: Sequelize.INTEGER,
    },
    jobType: {
        type: Sequelize.STRING
    }    
}, {
    timestamps: false
});

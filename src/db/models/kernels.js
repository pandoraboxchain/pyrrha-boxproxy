'use strict';
const Sequelize = require('sequelize');
const db = require('../db');

module.exports = db.define('kernels', {
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
    ipfsAddress: {
        type: Sequelize.STRING,
    },
    dataDim: {
        type: Sequelize.INTEGER,
    },
    currentPrice: {
        type: Sequelize.INTEGER,
    },
    complexity: {
        type: Sequelize.INTEGER,
    },
    metadata: {
        type: Sequelize.STRING
    },
    description: {
        type: Sequelize.STRING
    }
}, {
    timestamps: false
});

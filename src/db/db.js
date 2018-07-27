const path = require('path');
const Sequelize = require('sequelize');
const log = require('../logger');

const db = new Sequelize('database', null, null, {
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '../../market.db'),
    operatorsAliases: false,
    logging: process.env.NODE_ENV === 'development' ? data => log.info('Sequelize: %s', data) : false
});

module.exports = db;

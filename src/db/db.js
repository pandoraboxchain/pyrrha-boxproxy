const Sequelize = require('sequelize');

const db = new Sequelize('database', null, null, {
    dialect: 'sqlite',
    storage: 'market.db',
    logging: process.env.NODE_ENV === 'development'
});

module.exports = db;

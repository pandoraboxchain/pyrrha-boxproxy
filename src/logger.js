'use strict';
const winston = require('winston');

const config = {
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.splat(),
        winston.format.simple()
    ),
    exitOnError: false,
    transports: []
};

config.level = process.env.LOG_LEVEL || 'warn';

config.transports.push(new winston.transports.Console());

module.exports = winston.createLogger(config);

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

if (process.env.LOG_LEVEL) {

    config.level = process.env.LOG_LEVEL;
} else {
    
    config.level = 'error';
}

config.transports.push(new winston.transports.Console());

module.exports = winston.createLogger(config);

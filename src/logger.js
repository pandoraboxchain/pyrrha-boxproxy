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
    
    config.silent = true;
}

if (process.env.DEBUG && process.env.DEBUG.split(',').includes('boxproxy')) {

    config.transports.push(new winston.transports.Console());
    // @todo Add file logger
}

module.exports = winston.createLogger(config);

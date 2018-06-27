'use strict';
const winston = require('winston');

const config = {
    exitOnError: false,
    transports: []
};

if (process.env.LOG_LEVEL) {
    config.level = process.env.LOG_LEVEL;
} else {
    config.silent = true;
}

if (process.env.DEBUG && process.env.DEBUG.split(',').includes('boxproxy')) {

    config.transports.push(new winston.transports.Console({
        json: true,
        colorize: true
    }));
    // @todo Add file logger
}

module.exports = winston.createLogger(config);

'use strict';
const winston = require('winston');

const createLogger = level => {

    const config = {
        level,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.splat(),
            winston.format.simple()
        ),
        exitOnError: false,
        transports: []
    };
    
    // Setup transports
    config.transports.push(new winston.transports.Console());

    return winston.createLogger(config);
};

module.exports = createLogger(process.env.NODE_ENV === 'testing' ? 'error' : process.env.LOG_LEVEL || 'warn');
module.exports.createLogger = createLogger;

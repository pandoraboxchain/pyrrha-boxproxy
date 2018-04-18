'use strict';
const log = require('./logger');

// For better PM2 experience
process.on('uncaughtException', (err) => {
    log.error('An error has occured', err);
    process.exit(1);
});

const config = require('../config');

require('./server').createServer(config);

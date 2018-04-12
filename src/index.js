'use strict';
const debug = require('debug')('boxproxy');

// For better PM2 experience
process.on('uncaughtException', (err) => {
    debug('An error has occured', err);
    process.exit(1);
});

const config = require('../config');

require('./server')(config);

'use strict';

// For better PM2 experience
process.on('uncaughtException', (err) => {
    console.log('An error has occured', err);
    process.exit(1);
});

const config = require('../config');

require('./server')(config);

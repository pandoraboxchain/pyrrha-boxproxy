'use strict';
// For better PM2 experience
process.on('uncaughtException', err => {
    log.error(`An error has occured ${err}`);
    process.exit(1);
});

const config = require('../config');
const log = require('./logger');
const db = require('./db');
const pandora = require('./pandora');

db.on('error', err => log.error(`A database error has occured ${err}`));
db.once('initialized', () => log.info(`Database initialized`));
db.once('stopped', () => log.info(`Database stopped`));
db.init(config.database);

pandora.on('error', err => log.error(`A pandora error has occured ${err}`));
pandora.on('started', () => log.info(`Pandora synchronization has been started`));
pandora.on('paused', () => log.info(`Pandora synchronization has been paused`));
pandora.on('stopped', () => log.info(`Pandora synchronization has been stopped`));
pandora.on('initialized', () => {
    
});
pandora.start(config);

setInterval(_ => {}, 1000);

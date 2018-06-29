'use strict';
// For better PM2 experience
process.on('uncaughtException', err => {
    log.error('An error has occured %o', err);
    process.exit(1);
});

const config = require('../config');
const log = require('./logger');
const db = require('./db');
const pandora = require('./pandora');

db.on('error', err => log.error('A database error has occured', err));
db.once('initialized', () => log.info(`Database initialized`));
db.once('stopped', () => log.info(`Database stopped`));

pandora.on('error', err => log.error('A pandora error has occured', err));
pandora.on('started', () => log.info('Pandora synchronization has been started'));
pandora.on('paused', () => log.info('Pandora synchronization has been paused'));
pandora.on('stopped', () => log.info('Pandora synchronization has been stopped'));
pandora.on('initialized', () => log.info('Pandora synchronizer initialized'));
pandora.start(config);

db.addtask({
    name: 'addKernelsBaseline',
    source: pandora,
    event: 'kernelsRecords',// Listen this event on source
    action: 'kernels.add',// Run this action on event
    init: async () => {
        const isBaseline = await db.api.kernels.isBaseline();
        
        if (isBaseline) {

            return pandora.emit('subscribeKernels');
        }

        pandora.emit('getKernels', { baseline: true });
    },
});

// db.addtask({
//     name: '',
//     source: pandora
// });

db.init(config.database);

setInterval(_ => {}, 1000);

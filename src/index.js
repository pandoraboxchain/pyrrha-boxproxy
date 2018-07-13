'use strict';
// For better PM2 experience
process.on('uncaughtException', err => {
    log.error('An error has occured %o', err);
    process.exit(1);
});

const { safeObject } = require('./utils/json');
const config = require('../config');
const log = require('./logger');
const db = require('./db');
const pandora = require('./pandora');

pandora.on('error', err => log.error('A pandora error has occured', safeObject(err)));
pandora.on('started', () => log.info('Pandora synchronizer has been started'));
pandora.on('stopped', () => log.info('Pandora synchronizer has been stopped'));

db.on('error', err => log.error('A database error has occured', safeObject(err)));
db.once('initialized', () => {
    log.info(`Database initialized`);
    pandora.start(config);
});
db.once('stopped', () => log.info(`Database stopped`));

// Kernels baseline and subscription task
db.addTask({
    name: 'addKernelsBaseline',
    source: pandora,
    event: 'kernelsRecords',// Listen this event on source
    action: 'kernels.add',// Run this action on event
    initEvent: 'started',
    isInitialized: 'initialized',
    init: async () => {

        try {

            const isBaseline = await db.api.kernels.isBaseline();
        
            if (isBaseline) {

                const blockNumber = await db.api.system.getBlockNumber();
                return pandora.emit('subscribeKernels', { blockNumber });
            }

            pandora.emit('getKernels');
        } catch (err) {

            db.emit('error', err);
        }        
    },
});

// Last block number watching taks
db.addTask({
    name: 'watchBlockNumber',
    source: pandora,
    event: 'blockNumber',
    action: 'system.saveBlockNumber'
});

db.initialize(config.database);

setInterval(_ => {}, 1000);

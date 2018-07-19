'use strict';
const { safeObject } = require('./utils/json');
const log = require('./logger');

// For better PM2 experience
process.on('uncaughtException', err => {
    log.error('An error has occured %o', safeObject(err));
    process.exit(1);
});

const express = require('./express');
const routes = require('./routes');
const config = require('../config');
const db = require('./db');
const pandora = require('./pandora');

pandora.on('error', err => log.error('A pandora error has occured', safeObject(err)));
pandora.on('started', () => log.info('Pandora synchronizer has been started'));
pandora.on('stopped', () => log.info('Pandora synchronizer has been stopped'));

db.on('error', err => log.error('A database error has occured', safeObject(err)));
db.on('action', data => log.info('Action', safeObject(data)));
db.once('initialized', () => {
    log.info(`Database initialized`);
    pandora.start(config);
});
db.once('stopped', () => log.info(`Database stopped`));

// Last block number watching taks
db.addTask({
    name: 'watchBlockNumber',
    source: pandora,
    event: 'blockNumber',
    action: 'system.saveBlockNumber'
});

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

            const isBaseline = await db.api.system.isBaseline('kernelsBaseline');
        
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

// Remove kernels from Db if they has been removed from the PandoraMarket
db.addTask({
    name: 'removeKernelsOnEvent',
    source: pandora,
    event: 'kernelsRecordsRemove',
    action: 'kernels.remove'
});

// Datasets baseline and subscription task
db.addTask({
    name: 'addDatasetsBaseline',
    source: pandora,
    event: 'datasetsRecords',// Listen this event on source
    action: 'datasets.add',// Run this action on event
    initEvent: 'started',
    isInitialized: 'initialized',
    init: async () => {

        try {

            const isBaseline = await db.api.system.isBaseline('datasetsBaseline');
        
            if (isBaseline) {

                const blockNumber = await db.api.system.getBlockNumber();
                return pandora.emit('subscribeDatasets', { blockNumber });
            }

            pandora.emit('getDatasets');
        } catch (err) {

            db.emit('error', err);
        }        
    },
});

// Remove datasets from Db if they has been removed from the PandoraMarket
db.addTask({
    name: 'removeDatasetsOnEvent',
    source: pandora,
    event: 'datasetsRecordsRemove',
    action: 'datasets.remove'
});

// Jobs baseline and subscription task
db.addTask({
    name: 'addJobsBaseline',
    source: pandora,
    event: 'jobsRecords',// Listen this event on source
    action: 'jobs.add',// Run this action on event
    initEvent: 'started',
    isInitialized: 'initialized',
    init: async () => {

        try {

            const isBaseline = await db.api.system.isBaseline('jobsBaseline');
        
            if (isBaseline) {

                const blockNumber = await db.api.system.getBlockNumber();
                pandora.emit('subscribeJobs', { blockNumber });

                const jobs = await db.api.jobs.getAll({
                    filterBy: 'jobStatus:notIn:7,4:number'
                });

                if (jobs && jobs.length > 0) {

                    jobs.forEach(job => pandora.emit('subscribeJobAddress', {
                        address: job.address,
                        blockNumber
                    }));
                }

                return;
            }

            pandora.emit('getJobs');
        } catch (err) {

            db.emit('error', err);
        }        
    },
});

db.initialize(config.database);

// Init RESTful and APIs
const app = express(config);
routes(app).catch(err => log.error('An express server error has occured', safeObject(err)));

setInterval(_ => {}, 1000);

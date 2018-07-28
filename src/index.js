'use strict';
const { safeObject } = require('./utils/json');
const log = require('./logger');

// For better PM2 experience
process.on('uncaughtException', err => {
    log.error('An error has occured %o', safeObject(err));
    process.exit(1);
});

const config = require('../config');
const ws = require('./ws')(config);
const express = require('./express');
const routes = require('./routes');
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
db.on('action', data => ws.push(data));// publish actions data to websocket api

// Kernels baseline and subscription task
db.addTask({
    name: 'addKernels',
    source: pandora,
    event: 'kernelsRecords',// Listen this event on source
    action: 'kernels.add',// Run this action on event
    initEvent: 'started',
    isInitialized: 'initialized',
    init: async () => {

        try {

            const isBaseline = await db.api.system.isBaseline('kernelsBaseline');
        
            if (isBaseline) {

                const blockNumber = await db.api.system.getBlockNumber('kernels');
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
    name: 'removeKernels',
    source: pandora,
    event: 'kernelsRecordsRemove',
    action: 'kernels.remove'
});

// Datasets baseline and subscription task
db.addTask({
    name: 'addDatasets',
    source: pandora,
    event: 'datasetsRecords',// Listen this event on source
    action: 'datasets.add',// Run this action on event
    initEvent: 'started',
    isInitialized: 'initialized',
    init: async () => {

        try {

            const isBaseline = await db.api.system.isBaseline('datasetsBaseline');
        
            if (isBaseline) {

                const blockNumber = await db.api.system.getBlockNumber('datasets');
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
    name: 'removeDatasets',
    source: pandora,
    event: 'datasetsRecordsRemove',
    action: 'datasets.remove'
});

// Jobs baseline and subscription task
db.addTask({
    name: 'addJobs',
    source: pandora,
    event: 'jobsRecords',// Listen this event on source
    action: 'jobs.add',// Run this action on event
    initEvent: 'started',
    isInitialized: 'initialized',
    init: async () => {

        try {

            const isBaseline = await db.api.system.isBaseline('jobsBaseline');
        
            if (isBaseline) {

                const blockNumber = await db.api.system.getBlockNumber('jobs');
                pandora.emit('subscribeJobs', { blockNumber });
                pandora.emit('subscribeJobStateChanged', { blockNumber });
                return;
            }
            
            pandora.emit('getJobs');

        } catch (err) {

            db.emit('error', err);
        }        
    },
});

// Workers baseline and subscription task
db.addTask({
    name: 'addWorkers',
    source: pandora,
    event: 'workersRecords',
    action: 'workers.add',
    initEvent: 'started',
    isInitialized: 'initialized',
    init: async () => {

        try {

            const isBaseline = await db.api.system.isBaseline('workersBaseline');
        
            if (isBaseline) {

                const blockNumber = await db.api.system.getBlockNumber('workers');
                return pandora.emit('subscribeWorkers', { blockNumber });

                const workers = await db.api.workers.getAll({});

                if (workers && workers.length > 0) {

                    workers.forEach(worker => pandora.emit('subscribeWorkerAddress', {
                        address: worker.address,
                        blockNumber
                    }));
                }
            }

            pandora.emit('getWorkers');
        } catch (err) {

            db.emit('error', err);
        }        
    },
});

db.initialize(config);

// Init RESTful and APIs
const app = express(config);
routes(app).catch(err => log.error('An express server error has occured', safeObject(err)));

setInterval(_ => {}, 1000);

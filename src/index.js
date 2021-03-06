'use strict';
const { safeObject } = require('./utils/json');
const log = require('./logger');

// For better PM2 experience
process.on('uncaughtException', err => {
    log.error('An error has occured', safeObject(err));
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
pandora.on('disconnected', evt => log.warn('Connection lost and reconnection started',  evt.date));
pandora.on('connected', evt => log.warn('Pandora synchronizer has been connected',  evt.date));

db.on('error', err => log.error('A database error has occured', safeObject(err)));
db.once('initialized', () => {
    log.info(`Database initialized`);
    pandora.start(config);
});
db.once('stopped', () => log.info(`Database stopped`));
db.on('beforeAction', task => log.debug(`Database manager going to start an action for task "${task.name}"`, task.data));
db.on('action', data => ws.push(data));// publish action data to websocket api

// Kernels baseline and subscription task
db.addTask({
    name: 'addKernels',
    source: pandora,
    event: 'kernelsRecords',// Listen this event on source
    action: 'kernels.add',// Run this action on event
    initEvent: 'started',
    isInitialized: 'initialized',
    init: async (config) => {

        try {

            const isBaseline = await db.api.system.isBaseline('kernelsBaseline');
            log.debug(`"${config.name}" task has been initialized with baseline value: ${isBaseline}`);
        
            if (isBaseline) {

                const blockNumber = await db.api.system.getBlockNumber('kernels');
                pandora.emit('subscribeKernels', { blockNumber });
                return;
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
    init: async (config) => {

        try {

            const isBaseline = await db.api.system.isBaseline('datasetsBaseline');
            log.debug(`"${config.name}" task has been initialized with baseline value: ${isBaseline}`);
        
            if (isBaseline) {

                const blockNumber = await db.api.system.getBlockNumber('datasets');
                pandora.emit('subscribeDatasets', { blockNumber });
                return;
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
    init: async (config) => {

        try {

            const isBaseline = await db.api.system.isBaseline('jobsBaseline');
            log.debug(`"${config.name}" task has been initialized with baseline value: ${isBaseline}`);
        
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
    init: async (config) => {

        try {

            const isBaseline = await db.api.system.isBaseline('workersBaseline');
            log.debug(`"${config.name}" task has been initialized with baseline value: ${isBaseline}`);
        
            if (isBaseline) {

                const blockNumber = await db.api.system.getBlockNumber('workers');
                pandora.emit('subscribeWorkers', { blockNumber });

                const workers = await db.api.workers.getAll({});

                if (workers && workers.count > 0) {

                    workers.rows.forEach(worker => pandora.emit('subscribeWorkerAddress', {
                        address: worker.address,
                        blockNumber
                    }));
                }

                return;
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

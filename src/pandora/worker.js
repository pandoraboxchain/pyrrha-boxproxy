'use strict';
const StateManager = require('./stateManager');
const config = require('../../config');
const { safeObject } = require('../utils/json');
const kernelsApi = require('./api/kernels');
const datasetsApi = require('./api/datasets');
const jobsApi = require('./api/jobs');
const workersApi = require('./api/workers');
const pjs = require('./pjsConnector');
const {
    PJS_STOPPED,
    PJS_CONNECTING,
    PJS_CONNECTED
} = pjs;

// Process will alive while processGuard equal true
let processGuard = true;

// Pandora states
const PAN_STOPPED = 'PAN_STOPPED';
const PAN_STARTED = 'PAN_STARTED';

// Kernels states
const PAN_KERNELS_BASELINE = 'PAN_KERNELS_BASELINE';
const PAN_KERNELS_SUBSCRIBED = 'PAN_KERNELS_SUBSCRIBED';

// Datasets states
const PAN_DATASETS_BASELINE = 'PAN_DATASETS_BASELINE';
const PAN_DATASETS_SUBSCRIBED = 'PAN_DATASETS_SUBSCRIBED';

// Jobs states
const PAN_JOBS_BASELINE = 'PAN_JOBS_BASELINE';
const PAN_JOBS_SUBSCRIBED = 'PAN_JOBS_SUBSCRIBED';

// Workers states
const PAN_WORKERS_BASELINE = 'PAN_WORKERS_BASELINE';
const PAN_WORKERS_SUBSCRIBED = 'PAN_WORKERS_SUBSCRIBED';

// Worker state model
const stateModel = {
    pjs: {
        [PJS_STOPPED]: [PJS_CONNECTING],
        [PJS_CONNECTING]: [PJS_CONNECTED, PJS_STOPPED],
        [PJS_CONNECTED]: [PJS_CONNECTING, PJS_STOPPED]
    },
    pan: {
        [PAN_STOPPED]: [PAN_STARTED],
        [PAN_STARTED]: [PAN_STOPPED]
    },
    kernels: {
        [PAN_KERNELS_BASELINE]: [PAN_KERNELS_SUBSCRIBED],
        [PAN_KERNELS_SUBSCRIBED]: [PAN_KERNELS_BASELINE]
    },
    datasets: {
        [PAN_DATASETS_BASELINE]: [PAN_DATASETS_SUBSCRIBED],
        [PAN_DATASETS_SUBSCRIBED]: [PAN_DATASETS_BASELINE]
    },
    jobs: {
        [PAN_JOBS_BASELINE]: [PAN_JOBS_SUBSCRIBED],
        [PAN_JOBS_SUBSCRIBED]: [PAN_JOBS_BASELINE]
    },
    workers: {
        [PAN_WORKERS_BASELINE]: [PAN_WORKERS_SUBSCRIBED],
        [PAN_WORKERS_SUBSCRIBED]: [PAN_WORKERS_BASELINE]
    }
};

// Worker states conditions
const stateConditions = {
    [PAN_KERNELS_BASELINE]: {
        pan: [PAN_STARTED],
        pjs: [PJS_CONNECTED]
    },
    [PAN_KERNELS_SUBSCRIBED]: {
        pan: [PAN_STARTED],
        pjs: [PJS_CONNECTED]
    },
    [PAN_DATASETS_SUBSCRIBED]: {
        pan: [PAN_STARTED],
        pjs: [PJS_CONNECTED]
    },
    [PAN_JOBS_SUBSCRIBED]: {
        pan: [PAN_STARTED],
        pjs: [PJS_CONNECTED]
    },
    [PAN_WORKERS_SUBSCRIBED]: {
        pan: [PAN_STARTED],
        pjs: [PJS_CONNECTED]
    }
};

const state = new StateManager({
    model: stateModel,
    conditions: stateConditions,
    state: {
        pjs: PJS_STOPPED,
        pan: PAN_STOPPED,
        kernels: PAN_KERNELS_BASELINE,
        datasets: PAN_DATASETS_BASELINE,
        jobs: PAN_JOBS_BASELINE,
        workers: PAN_WORKERS_BASELINE
    }
});

// Dynamically handled subscriptions list
let subscriptions = [];

// Helper for sending errors
const sendError = err => {
    
    process.send({
        cmd: 'error',
        error: safeObject(err),
        date: Date.now()
    })
};

// Worker IPC messages manager
const messageManager = async (message) => {

    try {

        switch (message.cmd) {

            // Return all states of the worker
            case 'state':
                const currentState = state.get();

                process.send({
                    cmd: 'state',
                    state: currentState,
                    date: Date.now()
                });
                break;
            
            // Stop the worker
            case 'stop':
                await state.set({
                    pan: PAN_STOPPED
                });

                processGuard = false;

                break;
            
            // Start the worker
            case 'start':
                
                if (state.get('pjs') === PJS_STOPPED) {

                    await pjs.connect({
                        state,
                        config: {
                            protocol: config.protocol,
                            host: config.nodeHost,
                            port: config.nodePort,
                            wstimeout: config.wstimeout,
                            contracts: config.contracts,
                            addresses: config.addresses,
                            provider: config.provider // Pre-defined provider, usually defined in testing environment 
                        }
                    });
                }
                
                await state.set({
                    pan: PAN_STARTED
                });

                process.send({
                    cmd: 'started',
                    date: Date.now()
                });
                break;
            
            // Fetch kernels baseline
            case 'getKernelsRecords':
                
                const kernelsRecordsResult = await kernelsApi.getKernelsRecords(pjs);

                await state.set({
                    kernels: PAN_KERNELS_BASELINE
                });

                process.send({
                    cmd: 'kernelsRecords',
                    records: kernelsRecordsResult.records,
                    blockNumber: kernelsRecordsResult.blockNumber,
                    baseline: true,
                    date: Date.now()
                });
    
                break;
            
            // Subscribe to kernels updates
            case 'subscribeKernels':
                
                const kernelAdded = await kernelsApi.subscribeKernelAdded(pjs, {
                    fromBlock: message.blockNumber
                }, result => process.send({
                    cmd: 'kernelsRecords',
                    records: result.records,
                    blockNumber: result.blockNumber,
                    baseline: false,
                    date: Date.now()
                }), err => sendError(err));

                const kernelRemoved = await kernelsApi.subscribeKernelRemoved(pjs, {
                    fromBlock: message.blockNumber
                }, result => process.send({
                    cmd: 'kernelsRecordsRemove',
                    records: result.records,
                    blockNumber: result.blockNumber,
                    date: Date.now()
                }), err => sendError(err));

                subscriptions.push({
                    ...message,
                    events: [kernelAdded.event, kernelRemoved.event]
                });

                await state.set({
                    kernels: PAN_KERNELS_SUBSCRIBED
                });

                break;

            // Fetch datasets baseline
            case 'getDatasetsRecords':
                
                const datasetsRecordsResult = await datasetsApi.getDatasetsRecords(pjs);

                await state.set({
                    datasets: PAN_DATASETS_BASELINE
                });

                process.send({
                    cmd: 'datasetsRecords',
                    records: datasetsRecordsResult.records,
                    blockNumber: datasetsRecordsResult.blockNumber,
                    baseline: true,
                    date: Date.now()
                });
    
                break;
            
            // Subscribe to datasets updates
            case 'subscribeDatasets':
                
                const datasetAdded = await datasetsApi.subscribeDatasetAdded(pjs, {
                    fromBlock: message.blockNumber
                }, result => process.send({
                    cmd: 'datasetsRecords',
                    records: result.records,
                    blockNumber: result.blockNumber,
                    baseline: false,
                    date: Date.now()
                }), err => sendError(err));

                const datasetRemoved = await datasetsApi.subscribeDatasetRemoved(pjs, {
                    fromBlock: message.blockNumber
                }, result => process.send({
                    cmd: 'datasetsRecordsRemove',
                    records: result.records,
                    blockNumber: result.blockNumber,
                    date: Date.now()
                }), err => sendError(err));

                subscriptions.push({
                    ...message,
                    events: [datasetAdded.event, datasetRemoved.event]
                });

                await state.set({
                    datasets: PAN_DATASETS_SUBSCRIBED
                });

                break;

            // Fetch jobs baseline
            case 'getJobsRecords':
                
                const jobsRecordsResult = await jobsApi.getJobsRecords(pjs);

                await state.set({
                    jobs: PAN_JOBS_BASELINE
                });

                process.send({
                    cmd: 'jobsRecords',
                    records: jobsRecordsResult.records,
                    blockNumber: jobsRecordsResult.blockNumber,
                    baseline: true,
                    date: Date.now()
                });
    
                break;

            // Subscribe to new job created event
            case 'subscribeJobs':
                
                const cognitiveJobCreated = await jobsApi.subscribeCognitiveJobCreated(pjs, {
                    fromBlock: message.blockNumber
                }, result => process.send({
                    cmd: 'jobsRecords',
                    records: result.records,
                    blockNumber: result.blockNumber,
                    baseline: false,
                    date: Date.now()
                }), err => sendError(err));

                subscriptions.push({
                    ...message,
                    events: [cognitiveJobCreated.event]
                });

                await state.set({
                    jobs: PAN_JOBS_SUBSCRIBED
                });

                break;
            
            // Subscribe to jobs updates
            case 'subscribeJobStateChanged':

                const cognitiveJobStateChanged = await jobsApi.subscribeJobStateChanged(pjs, {
                    fromBlock: message.blockNumber
                }, result => process.send({
                    cmd: 'jobsRecords',
                    records: result.records,
                    blockNumber: result.blockNumber,
                    baseline: false,
                    date: Date.now()
                }), err => sendError(err));

                subscriptions.push({
                    ...message,
                    events: [cognitiveJobStateChanged.event]
                });

                break;

            // Fetch workers baseline
            case 'getWorkersRecords':
                
                const workersRecordsResult = await workersApi.getWorkersRecords(pjs);

                await state.set({
                    workers: PAN_WORKERS_BASELINE
                });

                process.send({
                    cmd: 'workersRecords',
                    records: workersRecordsResult.records,
                    blockNumber: workersRecordsResult.blockNumber,
                    baseline: true,
                    date: Date.now()
                });
    
                break;

            // Subscribe to new worker node created event
            case 'subscribeWorkers':
                
                const workerAdded = await workersApi.subscribeWorkerAdded(pjs, {
                    fromBlock: message.blockNumber
                }, result => process.send({
                    cmd: 'workersRecords',
                    records: result.records,
                    blockNumber: result.blockNumber,
                    baseline: false,
                    date: Date.now()
                }), err => sendError(err));

                subscriptions.push({
                    ...message,
                    events: [workerAdded.event]
                });

                await state.set({
                    workers: PAN_WORKERS_SUBSCRIBED
                });

                break;

            // Subscribe to specific worker node updates
            case 'subscribeWorkerAddress':

                const workerChanged = await workersApi.subscribeWorkerNodeStateChanged(pjs, message.address, {
                    fromBlock: message.blockNumber
                }, result => process.send({
                    cmd: 'workersRecords',
                    records: result.records,
                    blockNumber: result.blockNumber,
                    baseline: false,
                    date: Date.now()
                }), err => sendError(err));

                subscriptions.push({
                    ...message,
                    events: [workerChanged.event]
                });

                break;

            case 'unsubscribeWorkerAddress':

                subscriptions = subscriptions.filter(msg => {

                    if (msg.cmd !== 'subscribeWorkerAddress') {

                        return true;
                    }

                    if (msg.address === message.address) {

                        msg.events.map(evt => evt.unsubscribe());
                        return false;
                    }

                    return true;
                });

                break;

            default: 
                process.send({
                    cmd: 'error',
                    error: safeObject(new Error('Unknown command')),
                    date: Date.now()
                });
        }

    } catch (err) {

        sendError(err);
    }
};

// Listen for errors
pjs.on('error', err => process.send({
    cmd: 'error',
    error: safeObject(err),
    date: Date.now()
}));

// Re-subscribe all active subscriptions on reconnect
pjs.on('reconnected', blockNumber => {

    try {

        const originSubscriptions = subscriptions;
        subscriptions = [];
        
        originSubscriptions.forEach(message => {
            message.events.forEach(evt => evt.unsubscribe());
            message.events = [];

            messageManager({
                ...message,
                ...{
                    blockNumber
                }
            });
        });
    } catch (err) {

        sendError(err);
    }    
});

// Emit last block event
pjs.on('lastBlockNumber', blockNumber => process.send({
    cmd: 'lastBlockNumber',
    blockNumber,
    date: Date.now()
}));

// Handle messages obtained from host
process.on('message', messageManager);

// Do not close the workker until processGuard becomes false
setInterval(_ => {

    if (!processGuard) {

        process.send({
            cmd: 'stopped',
            date: Date.now()
        });
        process.exit(0);
    }
}, 1000);

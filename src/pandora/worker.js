'use strict';
const StateManager = require('./stateManager');
const config = require('../../config');
const { safeObject } = require('../utils/json');
const kernelsApi = require('./api/kernels');
const datasetsApi = require('./api/datasets');
const jobsApi = require('./api/jobs');
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
        jobs: PAN_JOBS_BASELINE
    }
});

// Dynamically handled subscriptions list
const subscriptions = [];

// Worker IPC messages manager
const messageManager = async (message) => {

    try {

        switch (message.cmd) {

            // Return all states of the worker
            case 'state':
                const currentState = state.get();

                process.send({
                    cmd: 'state',
                    state: currentState
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
                    cmd: 'started'
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
                    baseline: true
                });
    
                break;
            
            // Subscribe to kernels updates
            case 'subscribeKernels':
                
                const kernelAdded = await kernelsApi.subscribeKernelAdded(pjs, {
                    blockNumber: message.blockNumber
                }, result => process.send({
                    cmd: 'kernelsRecords',
                    records: result.records,
                    blockNumber: result.blockNumber,
                    baseline: false
                }), err => process.send({
                    cmd: 'error',
                    error: safeObject(err)
                }));

                const kernelRemoved = await kernelsApi.subscribeKernelRemoved(pjs, {
                    blockNumber: message.blockNumber
                }, result => process.send({
                    cmd: 'kernelsRecordsRemove',
                    records: result.records,
                    blockNumber: result.blockNumber
                }), err => process.send({
                    cmd: 'error',
                    error: safeObject(err)
                }));

                subscriptions.push({
                    ...message,
                    events: [kernelAdded, kernelRemoved]
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
                    baseline: true
                });
    
                break;
            
            // Subscribe to datasets updates
            case 'subscribeDatasets':
                
                const datasetAdded = await datasetsApi.subscribeDatasetAdded(pjs, {
                    blockNumber: message.blockNumber
                }, result => process.send({
                    cmd: 'datasetsRecords',
                    records: result.records,
                    blockNumber: result.blockNumber,
                    baseline: false
                }), err => process.send({
                    cmd: 'error',
                    error: safeObject(err)
                }));

                const datasetRemoved = await datasetsApi.subscribeDatasetRemoved(pjs, {
                    blockNumber: message.blockNumber
                }, result => process.send({
                    cmd: 'datasetsRecordsRemove',
                    records: result.records,
                    blockNumber: result.blockNumber
                }), err => process.send({
                    cmd: 'error',
                    error: safeObject(err)
                }));

                subscriptions.push({
                    ...message,
                    events: [datasetAdded, datasetRemoved]
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
                    baseline: true
                });
    
                break;

            // Subscribe to new job created event
            case 'subscribeJobs':
                
                const cognitiveJobCreated = await jobsApi.subscribeCognitiveJobCreated(pjs, {
                    blockNumber: message.blockNumber
                }, result => process.send({
                    cmd: 'jobsRecords',
                    records: result.records,
                    blockNumber: result.blockNumber,
                    baseline: false
                }), err => process.send({
                    cmd: 'error',
                    error: safeObject(err)
                }));

                subscriptions.push({
                    ...message,
                    events: [cognitiveJobCreated]
                });

                await state.set({
                    jobs: PAN_JOBS_SUBSCRIBED
                });

                break;
            
            // Subscribe to specific job updates
            case 'subscribeJobAddress':

                const cognitiveJobStateChanged = await jobsApi.subscribeCognitiveJobStateChanged(pjs, message.address, {
                    blockNumber: message.blockNumber
                }, result => process.send({
                    cmd: 'jobsRecords',
                    records: result.records,
                    blockNumber: result.blockNumber,
                    baseline: false
                }), err => process.send({
                    cmd: 'error',
                    error: safeObject(err)
                }));

                subscriptions.push({
                    ...message,
                    events: [cognitiveJobStateChanged]
                });

                break;

            case 'unsubscribeJobAddress':

                subscriptions = subscriptions.filter(msg => {

                    if (msg.cmd !== 'subscribeJobAddress') {

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
                    error: safeObject(new Error('Unknown command'))
                });
        }

    } catch (err) {

        process.send({
            cmd: 'error',
            error: safeObject(err)
        });
    }
};

// Listen for errors
pjs.on('error', err => process.send({
    cmd: 'error',
    error: safeObject(err)
}));

// Re-subscribe all active subscriptions on reconnect
pjs.on('reconnected', blockNumber => {
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
});

// Emit last block event
pjs.on('lastBlockNumber', blockNumber => process.send({
    cmd: 'blockNumber',
    blockNumber
}));

// Handle messages obtained from host
process.on('message', messageManager);

// Do not close the workker until processGuard becomes false
setInterval(_ => {

    if (!processGuard) {

        process.send({
            cmd: 'stopped'
        });
        process.exit(0);
    }
}, 1000);

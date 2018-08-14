'use strict';
const config = require('../../config');
const StateManager = require('./stateManager');
const SubscriptionsManager = require('./subscriptionsManager');
const log = require('../logger');
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

// Worker`s state
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

// Show state changes in debug mode
state.on('state_change', data => {
    log.debug(`WORKER: state changed`, data);
});

// Dynamically handled subscriptions list
const subscriptions = new SubscriptionsManager();

// Helper for sending errors
const sendError = (err, ...extra) => {
    const parsedExtra = extra.map(item => typeof item === 'object' ? safeObject(item) : item);
    log.error(`WORKER: error`, safeObject(err));

    process.send({
        cmd: 'error',
        error: safeObject(err),
        date: Date.now(),
        ...(parsedExtra.length > 0 ? { data: parsedExtra } : {})
    });
};

// Helper for messages sendig
const sendMessage = message => {

    const currentState = state.get('pjs');

    if (currentState !== PJS_STOPPED) {

        process.send(message);

        if (message.cmd !== 'lastBlockNumber') {

            log.debug(`WORKER: message sent`, message);
        }        
    }
};

/**
 * Worker IPC messages manager
 *
 * @param {Object} message Process message
 * @returns {Promise} 
 */
const messageManager = async (message) => {
    log.debug(`WORKER: a message received from the PandoraSync`, message);

    const connectionState = state.get('pjs');

    if (connectionState === PJS_CONNECTING) {

        log.warn(`WORKER: message was delayed due to connection status "${connectionState}"`);
        return pjs.once('connected', () => messageManager(message));
    }

    if (connectionState === PJS_STOPPED && message.cmd !== 'start') {
        
        log.warn(`WORKER: message was ignored due to connection status "${connectionState}"`);
        return sendError(new Error('Not connected. Message ignored'), message);
    }

    try {

        switch (message.cmd) {

            // Return all states of the worker
            case 'state':
                const currentState = state.get();

                sendMessage({
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

                sendMessage({
                    cmd: 'started',
                    date: Date.now()
                });
                break;
            
            // Fetch kernels baseline
            case 'getKernelsRecords':

                log.debug(`WORKER: going to run "getKernelsRecords"`);
                
                const kernelsRecordsResult = await kernelsApi.getKernelsRecords(pjs);

                await state.set({
                    kernels: PAN_KERNELS_BASELINE
                });

                log.debug(`WORKER: going to send "kernelsRecords" baseline`, kernelsRecordsResult);

                sendMessage({
                    cmd: 'kernelsRecords',
                    records: kernelsRecordsResult.records,
                    blockNumber: kernelsRecordsResult.blockNumber,
                    baseline: true,
                    date: Date.now()
                });
    
                break;
            
            // Subscribe to kernels updates
            case 'subscribeKernels':

                if (subscriptions.isSubscribed('KernelAdded') && 
                    subscriptions.isSubscribed('KernelRemoved')) {
                    
                    log.debug(`WORKER: command "subscribeKernelAdded" was ignored due to worker is already subscribed to events KernelAdded and KernelRemoved`);
                    break;
                }

                log.debug(`WORKER: going to run "subscribeKernelAdded"`, {
                    fromBlock: message.blockNumber
                });
                
                const kernelAdded = await kernelsApi.subscribeKernelAdded(pjs, {
                    fromBlock: message.blockNumber
                }, result => {
                    log.debug(`WORKER: going to send just added "kernelsRecords" received from event "subscribeKernelAdded"`, result);

                    sendMessage({
                        cmd: 'kernelsRecords',
                        records: result.records,
                        blockNumber: result.blockNumber,
                        baseline: false,
                        date: Date.now()
                    });
                }, err => sendError(err));

                subscriptions.register(message, kernelAdded);

                log.debug(`WORKER: going to run "subscribeKernelRemoved"`, {
                    fromBlock: message.blockNumber
                });

                const kernelRemoved = await kernelsApi.subscribeKernelRemoved(pjs, {
                    fromBlock: message.blockNumber
                }, result => {
                    log.debug(`WORKER: going to send just removed kernels received from event "subscribeKernelRemoved"`, result);

                    sendMessage({
                        cmd: 'kernelsRecordsRemove',
                        records: result.records,
                        blockNumber: result.blockNumber,
                        date: Date.now()
                    });
                }, err => sendError(err));

                subscriptions.register(message, kernelRemoved);

                log.debug(`WORKER: events "kernelAdded", "kernelRemoved" added to subscriptions list`);

                await state.set({
                    kernels: PAN_KERNELS_SUBSCRIBED
                });

                break;

            // Fetch datasets baseline
            case 'getDatasetsRecords':

                log.debug(`WORKER: going to run "getDatasetsRecords"`);
                
                const datasetsRecordsResult = await datasetsApi.getDatasetsRecords(pjs);

                await state.set({
                    datasets: PAN_DATASETS_BASELINE
                });

                log.debug(`WORKER: going to send "datasetsRecords" baseline`, datasetsRecordsResult);

                sendMessage({
                    cmd: 'datasetsRecords',
                    records: datasetsRecordsResult.records,
                    blockNumber: datasetsRecordsResult.blockNumber,
                    baseline: true,
                    date: Date.now()
                });
    
                break;
            
            // Subscribe to datasets updates
            case 'subscribeDatasets':

                if (subscriptions.isSubscribed('DatasetAdded') && 
                    subscriptions.isSubscribed('DatasetRemoved')) {
                    
                    log.debug(`WORKER: command "subscribeDatasetAdded" was ignored due to worker is already subscribed to events DatasetAdded and DatasetRemoved`);
                    break;
                }

                log.debug(`WORKER: going to run "subscribeDatasetAdded"`, {
                    fromBlock: message.blockNumber
                });
                
                const datasetAdded = await datasetsApi.subscribeDatasetAdded(pjs, {
                    fromBlock: message.blockNumber
                }, result => {
                    log.debug(`WORKER: going to send just added "datasetsRecords" received from event "subscribeDatasetAdded"`, result);

                    sendMessage({
                        cmd: 'datasetsRecords',
                        records: result.records,
                        blockNumber: result.blockNumber,
                        baseline: false,
                        date: Date.now()
                    });
                }, err => sendError(err));

                subscriptions.register(message, datasetAdded);

                log.debug(`WORKER: going to run "subscribeDatasetRemoved"`, {
                    fromBlock: message.blockNumber
                });

                const datasetRemoved = await datasetsApi.subscribeDatasetRemoved(pjs, {
                    fromBlock: message.blockNumber
                }, result => {
                    log.debug(`WORKER: going to send just removed datasets received from event "subscribeDatasetRemoved"`, result);

                    sendMessage({
                        cmd: 'datasetsRecordsRemove',
                        records: result.records,
                        blockNumber: result.blockNumber,
                        date: Date.now()
                    });
                }, err => sendError(err));

                subscriptions.register(message, datasetRemoved);

                await state.set({
                    datasets: PAN_DATASETS_SUBSCRIBED
                });

                break;

            // Fetch jobs baseline
            case 'getJobsRecords':

                log.debug(`WORKER: going to run "getJobsRecords"`);
                
                const jobsRecordsResult = await jobsApi.getJobsRecords(pjs);

                await state.set({
                    jobs: PAN_JOBS_BASELINE
                });

                log.debug(`WORKER: going to send "jobsRecords" baseline`, jobsRecordsResult);

                sendMessage({
                    cmd: 'jobsRecords',
                    records: jobsRecordsResult.records,
                    blockNumber: jobsRecordsResult.blockNumber,
                    baseline: true,
                    date: Date.now()
                });
    
                break;

            // Subscribe to new job created event
            case 'subscribeJobs':

                if (subscriptions.isSubscribed('CognitiveJobCreated')) {
                    
                    log.debug(`WORKER: command "subscribeCognitiveJobCreated" was ignored due to worker is already subscribed to event CognitiveJobCreated`);
                    break;
                }

                log.debug(`WORKER: going to run "subscribeCognitiveJobCreated"`, {
                    fromBlock: message.blockNumber
                });
                
                const cognitiveJobCreated = await jobsApi.subscribeCognitiveJobCreated(pjs, {
                    fromBlock: message.blockNumber
                }, result => {
                    log.debug(`WORKER: going to send just added "jobsRecords" received from event "subscribeCognitiveJobCreated"`, result);

                    sendMessage({
                        cmd: 'jobsRecords',
                        records: result.records,
                        blockNumber: result.blockNumber,
                        baseline: false,
                        date: Date.now()
                    });
                }, err => sendError(err));

                subscriptions.register(message, cognitiveJobCreated);

                await state.set({
                    jobs: PAN_JOBS_SUBSCRIBED
                });

                break;
            
            // Subscribe to jobs updates
            case 'subscribeJobStateChanged':

                if (subscriptions.isSubscribed('JobStateChanged') && 
                    subscriptions.isSubscribed('CognitionProgressed')) {
                    
                    log.debug(`WORKER: command "subscribeJobStateChanged" was ignored due to worker is already subscribed to events JobStateChanged and CognitionProgressed`);
                    break;
                }

                log.debug(`WORKER: going to run "subscribeJobStateChanged"`, {
                    fromBlock: message.blockNumber
                });

                const cognitiveJobStateChanged = await jobsApi.subscribeJobStateChanged(pjs, {
                    fromBlock: message.blockNumber
                }, result => {
                    log.debug(`WORKER: going to send just changed "jobsRecords" received from event "subscribeJobStateChanged"`, result);

                    sendMessage({
                        cmd: 'jobsRecords',
                        records: result.records,
                        blockNumber: result.blockNumber,
                        baseline: false,
                        date: Date.now()
                    });
                }, err => sendError(err));

                subscriptions.register(message, cognitiveJobStateChanged);

                break;

            // Fetch workers baseline
            case 'getWorkersRecords':

                log.debug(`WORKER: going to run "getWorkersRecords"`);
                
                const workersRecordsResult = await workersApi.getWorkersRecords(pjs);

                await state.set({
                    workers: PAN_WORKERS_BASELINE
                });

                log.debug(`WORKER: going to send "jobsRecords" baseline`, workersRecordsResult);

                sendMessage({
                    cmd: 'workersRecords',
                    records: workersRecordsResult.records,
                    blockNumber: workersRecordsResult.blockNumber,
                    baseline: true,
                    date: Date.now()
                });
    
                break;

            // Subscribe to new worker node created event
            case 'subscribeWorkers':

                if (subscriptions.isSubscribed('WorkerNodeCreated')) {
                        
                    log.debug(`WORKER: command "subscribeWorkerAdded" was ignored due to worker is already subscribed to event WorkerNodeCreated`);
                    break;
                }

                log.debug(`WORKER: going to run "subscribeWorkerAdded"`, {
                    fromBlock: message.blockNumber
                });
                
                const workerAdded = await workersApi.subscribeWorkerAdded(pjs, {
                    fromBlock: message.blockNumber
                }, result => {

                    log.debug(`WORKER: going to send just added "workersRecords" received from event "subscribeWorkerAdded"`, result);

                    sendMessage({
                        cmd: 'workersRecords',
                        records: result.records,
                        blockNumber: result.blockNumber,
                        baseline: false,
                        date: Date.now()
                    });
                }, err => sendError(err));

                subscriptions.register(message, workerAdded);

                await state.set({
                    workers: PAN_WORKERS_SUBSCRIBED
                });

                break;

            // Subscribe to specific worker node updates
            case 'subscribeWorkerAddress':

                log.debug(`WORKER: going to run "subscribeWorkerNodeStateChanged"`, {
                    address: message.address,
                    fromBlock: message.blockNumber
                });

                if (!subscriptions.isSubscribed('WorkerNodeStateChanged', message, 'address')) {

                    const workerChanged = await workersApi.subscribeWorkerNodeStateChanged(pjs, message.address, {
                        fromBlock: message.blockNumber
                    }, result => {
                        log.debug(`WORKER: going to send just changed "workersRecords" received from event "subscribeWorkerNodeStateChanged"`, result);
    
                        sendMessage({
                            cmd: 'workersRecords',
                            records: result.records,
                            blockNumber: result.blockNumber,
                            baseline: false,
                            date: Date.now()
                        });
                    }, err => sendError(err));
    
                    subscriptions.register(message, workerChanged);
                }

                break;

            case 'unsubscribeWorkerAddress':

                subscriptions.remove('WorkerNodeStateChanged', message, 'address');

                break;

            case 'getSubscriptionsList':

                const subscriptionsList = subscriptions.getList();

                sendMessage({
                    cmd: 'subscriptionsList',
                    records: subscriptionsList,
                    count: subscriptionsList.length,
                    date: Date.now()
                });
                
                break;

            default: 
                sendError(new Error('Unknown command'), message);
        }

    } catch (err) {

        sendError(err);
    }
};

// Listen for errors
pjs.on('error', err => sendError(err));

pjs.on('disconnected', data => sendMessage({
    cmd: 'disconnected',
    date: data.date
}));

// Re-subscribe all active subscriptions on reconnect
pjs.on('connected', async (data) => {

    try {

        await subscriptions.refresh(data.blockNumber, messageManager);

        sendMessage({
            cmd: 'connected',
            date: Date.now()
        });
    } catch (err) {

        sendError(err);
    }    
});

// Emit last block event
pjs.on('lastBlockNumber', blockNumber => sendMessage({
    cmd: 'lastBlockNumber',
    blockNumber,
    date: Date.now()
}));

// Handle messages received from host
process.on('message', messageManager);

// Do not close the workker until processGuard becomes false
setInterval(_ => {

    if (!processGuard) {

        sendMessage({
            cmd: 'stopped',
            date: Date.now()
        });
        process.exit(0);
    }
}, 1000);

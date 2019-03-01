const config = require('../../config');
const StateManager = require('./stateManager');
const SubscriptionsManager = require('./subscriptionsManager');
const log = require('../logger');
const { safeObject } = require('../utils/json');
const kernelsApi = require('./api/kernels');
const datasetsApi = require('./api/datasets');
const jobsApi = require('./api/jobs');
const workersApi = require('./api/workers');
const Pjs = require('pyrrha-js').default;
const {
    default: PjsWsConnector,
    CONNECTING, 
    CONNECTED, 
    DISCONNECTED,
    STOPPED,
} = require('pyrrha-js/dist/connector');

if (process.env.NODE_ENV === 'testing') {
    config.wstimeout = parseInt(process.env.TESTING_WSTIMEOUT);
    config.addresses.Pan = process.env.TESTING_ADDRESS_PAN;
    config.addresses.Pandora = process.env.TESTING_ADDRESS_PANDORA;
    config.addresses.PandoraMarket = process.env.TESTING_ADDRESS_PANDORA_MARKET;
    config.addresses.EconomicController = process.env.TESTING_ADDRESS_ECONOMIC;
}

const pjsConnector = new PjsWsConnector(Pjs, {
    config: {
        protocol: config.protocol,
        host: config.nodeHost,
        port: config.nodePort,
        wstimeout: config.wstimeout,
        provider: undefined,
        contracts: config.contracts,
        addresses: config.addresses
    }
});

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
        pan: [PAN_STARTED]
    },
    [PAN_KERNELS_SUBSCRIBED]: {
        pan: [PAN_STARTED]
    },
    [PAN_DATASETS_SUBSCRIBED]: {
        pan: [PAN_STARTED]
    },
    [PAN_JOBS_SUBSCRIBED]: {
        pan: [PAN_STARTED]
    },
    [PAN_WORKERS_SUBSCRIBED]: {
        pan: [PAN_STARTED]
    }
};

// Worker`s state
const state = new StateManager({
    model: stateModel,
    conditions: stateConditions,
    state: {
        pan: PAN_STOPPED,
        kernels: PAN_KERNELS_BASELINE,
        datasets: PAN_DATASETS_BASELINE,
        jobs: PAN_JOBS_BASELINE,
        workers: PAN_WORKERS_BASELINE
    }
});

// Show state changes in debug mode
state.on('state_change', data => {
    log.debug('WORKER: state changed', data);
});

// Helper for sending errors
const sendError = (err, ...extra) => {
    const parsedExtra = extra.map(item => typeof item === 'object' ? safeObject(item) : item);
    log.error('WORKER: error', safeObject(err));

    process.send({
        cmd: 'error',
        error: safeObject(err),
        date: Date.now(),
        ...(parsedExtra.length > 0 ? { data: parsedExtra } : {})
    });
};

// Helper for messages sendig
const sendMessage = message => {

    if (pjsConnector.readyState !== STOPPED) {

        process.send(message);

        if (message.cmd !== 'lastBlockNumber') {

            log.debug('WORKER: message sent', message);
        }        
    }
};

// Dynamically handled subscriptions list
const subscriptions = new SubscriptionsManager();
subscriptions.subscriptions.on('error', sendError);

/**
 * Worker IPC messages manager
 *
 * @param {Object} message Process message
 * @returns {Promise} 
 */
const messageManager = async (message) => {
    log.debug('WORKER: a message received from the PandoraSync', message);

    if (pjsConnector.readyState === CONNECTING) {

        log.warn(`WORKER: message was delayed due to connection status "${pjsConnector.readyState}"`);
        return pjsConnector.once('connected', () => messageManager(message));
    }

    if ((pjsConnector.readyState === STOPPED || pjsConnector.readyState === DISCONNECTED) && 
        message.cmd !== 'start' && message.cmd !== 'stop') {
        
        log.warn(`WORKER: message was ignored due to connection status "${pjsConnector.readyState}"`);
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
                await pjsConnector.close();
                
                await state.set({
                    pan: PAN_STOPPED
                });

                processGuard = false;

                break;
            
            // Start the worker
            case 'start':

                if (pjsConnector.readyState === CONNECTED) {

                    sendMessage({
                        cmd: 'started',
                        date: Date.now()
                    });
                    break;
                }

                if (pjsConnector.readyState === STOPPED || pjsConnector.readyState === DISCONNECTED) {

                    await pjsConnector.connect();
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

                log.debug('WORKER: going to run "getKernelsRecords"');
                
                const kernelsRecordsResult = await kernelsApi.getKernelsRecords(pjsConnector.pjs);

                await state.set({
                    kernels: PAN_KERNELS_BASELINE
                });

                log.debug('WORKER: going to send "kernelsRecords" baseline', kernelsRecordsResult);

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

                const kernelsSubscriptionsProms = [];

                kernelsSubscriptionsProms.push(new Promise((resolve, reject) => {

                    subscriptions.create({
                        ...message,
                        name: 'KernelAdded'
                    }, ['cmd', 'name'], async message => {
    
                        log.debug('WORKER: going to run "subscribeKernelAdded"', {
                            fromBlock: message.blockNumber
                        });
                        
                        const kernelAdded = await kernelsApi.subscribeKernelAdded(pjsConnector.pjs, {
                            fromBlock: message.blockNumber
                        }, result => {
                            log.debug('WORKER: going to send just added "kernelsRecords" received from event "subscribeKernelAdded"', result);
        
                            sendMessage({
                                cmd: 'kernelsRecords',
                                records: result.records,
                                blockNumber: result.blockNumber,
                                baseline: false,
                                date: Date.now()
                            });
                        }, reject);
    
                        return {
                            ...message,
                            events: kernelAdded.event
                        };
                    }, resolve);
                }));

                kernelsSubscriptionsProms.push(new Promise((resolve, reject) => {

                    subscriptions.create({
                        ...message,
                        name: 'KernelRemoved'
                    }, ['cmd', 'name'], async message => {
    
                        log.debug('WORKER: going to run "subscribeKernelRemoved"', {
                            fromBlock: message.blockNumber
                        });
        
                        const kernelRemoved = await kernelsApi.subscribeKernelRemoved(pjsConnector.pjs, {
                            fromBlock: message.blockNumber
                        }, result => {
                            log.debug('WORKER: going to send just removed kernels received from event "subscribeKernelRemoved"', result);
        
                            sendMessage({
                                cmd: 'kernelsRecordsRemove',
                                records: result.records,
                                blockNumber: result.blockNumber,
                                date: Date.now()
                            });
                        }, reject);                    
    
                        return {
                            ...message,
                            events: kernelRemoved.event
                        };
                    }, resolve);
                }));

                await Promise.all(kernelsSubscriptionsProms);

                await state.set({
                    kernels: PAN_KERNELS_SUBSCRIBED
                });

                break;

            // Fetch datasets baseline
            case 'getDatasetsRecords':

                log.debug('WORKER: going to run "getDatasetsRecords"');
                
                const datasetsRecordsResult = await datasetsApi.getDatasetsRecords(pjsConnector.pjs);

                await state.set({
                    datasets: PAN_DATASETS_BASELINE
                });

                log.debug('WORKER: going to send "datasetsRecords" baseline', datasetsRecordsResult);

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

                const datasetsSubscriptionsProms = [];

                datasetsSubscriptionsProms.push(new Promise((resolve, reject) => {

                    subscriptions.create({
                        ...message,
                        name: 'DatasetAdded'
                    }, ['cmd', 'name'], async message => {
    
                        log.debug('WORKER: going to run "subscribeDatasetAdded"', {
                            fromBlock: message.blockNumber
                        });
                        
                        const datasetAdded = await datasetsApi.subscribeDatasetAdded(pjsConnector.pjs, {
                            fromBlock: message.blockNumber
                        }, result => {
                            log.debug('WORKER: going to send just added "datasetsRecords" received from event "subscribeDatasetAdded"', result);
        
                            sendMessage({
                                cmd: 'datasetsRecords',
                                records: result.records,
                                blockNumber: result.blockNumber,
                                baseline: false,
                                date: Date.now()
                            });
                        }, reject);
    
                        return {
                            ...message,
                            events: datasetAdded.event
                        };
                    }, resolve);
                }));
                
                datasetsSubscriptionsProms.push(new Promise((resolve, reject) => {

                    subscriptions.create({
                        ...message,
                        name: 'DatasetRemoved'
                    }, ['cmd', 'name'], async message => {
    
                        log.debug('WORKER: going to run "subscribeDatasetRemoved"', {
                            fromBlock: message.blockNumber
                        });
        
                        const datasetRemoved = await datasetsApi.subscribeDatasetRemoved(pjsConnector.pjs, {
                            fromBlock: message.blockNumber
                        }, result => {
                            log.debug('WORKER: going to send just removed datasets received from event "subscribeDatasetRemoved"', result);
        
                            sendMessage({
                                cmd: 'datasetsRecordsRemove',
                                records: result.records,
                                blockNumber: result.blockNumber,
                                date: Date.now()
                            });
                        }, reject);
    
                        return {
                            ...message,
                            events: datasetRemoved.event
                        };
                    }, resolve);
                }));

                await Promise.all(datasetsSubscriptionsProms);
                
                await state.set({
                    datasets: PAN_DATASETS_SUBSCRIBED
                });

                break;

            // Fetch jobs baseline
            case 'getJobsRecords':

                log.debug('WORKER: going to run "getJobsRecords"');
                
                const jobsRecordsResult = await jobsApi.getJobsRecords(pjsConnector.pjs);

                await state.set({
                    jobs: PAN_JOBS_BASELINE
                });

                log.debug('WORKER: going to send "jobsRecords" baseline', jobsRecordsResult);

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

                await new Promise((resolve, reject) => {

                    subscriptions.create(message, ['cmd'], async message => {

                        log.debug('WORKER: going to run "subscribeCognitiveJobCreated"', {
                            fromBlock: message.blockNumber
                        });
                        
                        const cognitiveJobCreated = await jobsApi.subscribeCognitiveJobCreated(pjsConnector.pjs, {
                            fromBlock: message.blockNumber
                        }, result => {
                            log.debug('WORKER: going to send just added "jobsRecords" received from event "subscribeCognitiveJobCreated"', result);
        
                            sendMessage({
                                cmd: 'jobsRecords',
                                records: result.records,
                                blockNumber: result.blockNumber,
                                baseline: false,
                                date: Date.now()
                            });
                        }, reject);
    
                        return {
                            ...message,
                            events: cognitiveJobCreated.event
                        };
                    }, resolve);
                });

                await state.set({
                    jobs: PAN_JOBS_SUBSCRIBED
                });

                break;
            
            // Subscribe to jobs updates
            case 'subscribeJobStateChanged':

                await new Promise((resolve, reject) => {

                    subscriptions.create(message, ['cmd'], async message => {

                        log.debug('WORKER: going to run "subscribeJobStateChanged"', {
                            fromBlock: message.blockNumber
                        });
        
                        const cognitiveJobStateChanged = await jobsApi.subscribeJobStateChanged(pjsConnector.pjs, {
                            fromBlock: message.blockNumber
                        }, result => {
                            log.debug('WORKER: going to send just changed "jobsRecords" received from event "subscribeJobStateChanged"', result);
        
                            sendMessage({
                                cmd: 'jobsRecords',
                                records: result.records,
                                blockNumber: result.blockNumber,
                                baseline: false,
                                date: Date.now()
                            });
                        }, reject);
    
                        return {
                            ...message,
                            events: cognitiveJobStateChanged.event
                        };
                    }, resolve);
                });
                
                break;

            // Fetch workers baseline
            case 'getWorkersRecords':

                log.debug('WORKER: going to run "getWorkersRecords"');
                
                const workersRecordsResult = await workersApi.getWorkersRecords(pjsConnector.pjs);

                await state.set({
                    workers: PAN_WORKERS_BASELINE
                });

                log.debug('WORKER: going to send "jobsRecords" baseline', workersRecordsResult);

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

                await new Promise((resolve, reject) => {

                    subscriptions.create(message, ['cmd'], async message => {

                        log.debug('WORKER: going to run "subscribeWorkerAdded"', {
                            fromBlock: message.blockNumber
                        });
                        
                        const workerAdded = await workersApi.subscribeWorkerAdded(pjsConnector.pjs, {
                            fromBlock: message.blockNumber
                        }, result => {
        
                            log.debug('WORKER: going to send just added "workersRecords" received from event "subscribeWorkerAdded"', result);
        
                            sendMessage({
                                cmd: 'workersRecords',
                                records: result.records,
                                blockNumber: result.blockNumber,
                                baseline: false,
                                date: Date.now()
                            });
                        }, reject);
    
                        return {
                            ...message,
                            events: workerAdded.event
                        };
                    }, resolve);
                });

                await state.set({
                    workers: PAN_WORKERS_SUBSCRIBED
                });

                break;

            // Subscribe to specific worker node updates
            case 'subscribeWorkerAddress':

                subscriptions.create(message, ['cmd', 'address'], async message => {

                    log.debug('WORKER: going to run "subscribeWorkerNodeStateChanged"', {
                        address: message.address,
                        fromBlock: message.blockNumber
                    });

                    const workerChanged = await workersApi.subscribeWorkerNodeStateChanged(pjsConnector.pjs, message.address, {
                        fromBlock: message.blockNumber
                    }, result => {
                        log.debug('WORKER: going to send just changed "workersRecords" received from event "subscribeWorkerNodeStateChanged"', result);
    
                        sendMessage({
                            cmd: 'workersRecords',
                            records: result.records,
                            blockNumber: result.blockNumber,
                            baseline: false,
                            date: Date.now()
                        });
                    }, sendError);

                    return {
                        ...message,
                        events: workerChanged.event
                    };
                });

                break;

            case 'unsubscribeWorkerAddress':

                subscriptions.remove({
                    cmd: 'subscribeWorkerAddress',
                    address: message.address
                });

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
pjsConnector.on('error', sendError);

pjsConnector.on('timeout', () => sendMessage({
    cmd: 'disconnected',
    date: Date.now()
}));

// Re-subscribe all active subscriptions on reconnect
pjsConnector.on('connected', async (data) => {

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
pjsConnector.on('lastBlockNumber', blockNumber => sendMessage({
    cmd: 'lastBlockNumber',
    blockNumber,
    date: Date.now()
}));

// Handle messages received from host
process.on('message', messageManager);

// Do not close the workker until processGuard becomes false
setInterval(_ => {

    if (!processGuard) {

        log.debug('WORKER going to be stopped');
        sendMessage({
            cmd: 'stopped',
            date: Date.now()
        });
        process.exit(0);
    }
}, 1000);

// Send ready event
sendMessage({
    cmd: 'ready',
    date: Date.now()
});

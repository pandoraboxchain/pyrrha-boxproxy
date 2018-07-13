'use strict';
const StateManager = require('./stateManager');
const config = require('../../config');
const { safeObject } = require('../utils/json');
const kernelsApi = require('./api/kernels');
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
    }
};

const state = new StateManager({
    model: stateModel,
    conditions: stateConditions,
    state: {
        pjs: PJS_STOPPED,
        pan: PAN_STOPPED,
        kernels: PAN_KERNELS_BASELINE
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
                
                subscriptions.push(message.cmd);

                await kernelsApi.subscribeKernelAdded(pjs, {
                    blockNumber: message.blockNumber || undefined
                }, result => process.send({
                    cmd: 'kernelsRecords',
                    records: result.records,
                    blockNumber: result.blockNumber,
                    baseline: false
                }), err => process.send({
                    cmd: 'error',
                    error: safeObject(err)
                }));

                await kernelsApi.subscribeKernelRemoved(pjs, {
                    blockNumber: message.blockNumber || undefined
                }, result => process.send({
                    cmd: 'kernelsRecordsRemove',
                    records: result.records,
                    blockNumber: result.blockNumber
                }), err => process.send({
                    cmd: 'error',
                    error: safeObject(err)
                }));

                await state.set({
                    kernels: PAN_KERNELS_SUBSCRIBED
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

pjs.on('error', err => process.send({
    cmd: 'error',
    error: safeObject(err)
}));

pjs.on('reconnected', blockNumber => subscriptions.map(cmd => {
    cmd,
    blockNumber
}));

pjs.on('lastBlockNumber', blockNumber => process.send({
    cmd: 'blockNumber',
    blockNumber
}));

process.on('message', messageManager);

setInterval(_ => {

    if (!processGuard) {

        process.send({
            cmd: 'stopped'
        });
        process.exit(0);
    }
}, 1000);

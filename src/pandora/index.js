const path = require('path');
const { EventEmitter } = require('events');
const { fork } = require('child_process');
const log = require('../logger');
const { safeObject } = require('../utils/json');

/**
 * Pandora synchronizer
 *
 * @class PandoraSync
 * @extends {EventEmitter}
 * @event error
 * @event started
 * @event stopped
 * @event kernelsRecords
 * @event blockNumber
 */
class PandoraSync extends EventEmitter {
    
    /**
     *Creates an instance of PandoraSync.
     * @memberof PandoraSync
     */
    constructor() {
        super();
        this.worker = null;
        this.initialized = false;
        this.paused = false;
        this.options = {
            execArgv: process.env.DEBUG && process.env.DEBUG.includes('worker') ? {
                execArgv: ['--inspect-brk=47977']
            } : undefined
        };

        this._setupOperationsHandlers();
    }

    // IPC messages manager (from the worker)
    _messageManager(message) {

        if (message.cmd !== 'lastBlockNumber') {
            log.debug('PandoraSync: A message has been received from the worker', message);
        }
        
        switch(message.cmd) {
            case 'debug':
                // log.debug('Debug:', message);
                console.log('Debug:', message);
                break;

            case 'state':
                this.emit('state', {
                    state: message.state,
                    date: message.date
                });
                break;

            case 'error':
                const outError = new Error(message.error && message.error.message ? message.error.message : 'Unknown error');
                outError.date = message.date;
                outError.sourceStack = message.error && message.error.stack ? message.error.stack : '';
                outError.data = message.data ? message.data : {};
                this.emit('error', outError);                
                break;

            case 'ready':
                this.worker.send({
                    cmd: 'start'
                });
                break;

            case 'started':
                this.initialized = true;
                this.emit('started', {
                    date: message.date
                });
                break;

            case 'stopped':
                this.initialized = false;
                this.emit('stopped', {
                    date: message.date
                });
                break;

            case 'connected':
                this.emit('reconnected', {
                    date: message.date
                });
                break;

            case 'disconnected':
                this.emit('disconnected', {
                    date: message.date
                });
                break;

            case 'kernelsRecords':
                this.emit('kernelsRecords', {
                    records: message.records || [],
                    blockNumber: message.blockNumber,
                    baseline: message.baseline || false
                });
                break;

            case 'kernelsRecordsRemove':
                this.emit('kernelsRecordsRemove', {
                    records: message.records || [],
                    blockNumber: message.blockNumber,
                    baseline: message.baseline || false
                });
                break;

            case 'datasetsRecords':
                this.emit('datasetsRecords', {
                    records: message.records || [],
                    blockNumber: message.blockNumber,
                    baseline: message.baseline || false
                });
                break;

            case 'datasetsRecordsRemove':
                this.emit('datasetsRecordsRemove', {
                    records: message.records || [],
                    blockNumber: message.blockNumber,
                    baseline: message.baseline || false
                });
                break;

            case 'jobsRecords':
                this.emit('jobsRecords', {
                    records: message.records || [],
                    blockNumber: message.blockNumber,
                    baseline: message.baseline || false
                });
                break;

            case 'jobsRecordsUpdate':
                this.emit('jobsRecordsUpdate', {
                    records: message.records || [],
                    blockNumber: message.blockNumber,
                    baseline: message.baseline || false
                });
                break;

            case 'workersRecords':
                this.emit('workersRecords', {
                    records: message.records || [],
                    blockNumber: message.blockNumber,
                    baseline: message.baseline || false
                });
                break;

            case 'workersRecordsUpdate':
                this.emit('workersRecordsUpdate', {
                    records: message.records || [],
                    blockNumber: message.blockNumber,
                    baseline: message.baseline || false
                });
                break;

            case 'subscriptionsList':
                this.emit('subscriptionsList', {
                    records: message.records || [],
                    count: message.count,
                    date: message.date
                });
                break;

            case 'lastBlockNumber':
                this.emit('lastBlockNumber', {
                    name: 'lastBlock',
                    blockNumber: message.blockNumber
                });
                break;

            default:
                log.debug('PandoraSync: Unknown worker command', message);
                this.emit('error', new Error('Unknown worker command'));
        }
    }

    // Pandora synchronizer events handlers
    _setupOperationsHandlers() {

        this.on('getState', () => {
            log.debug('PandoraSync: "getState" event has been emitted');

            this.worker.send({
                cmd: 'state'
            });
        });

        this.on('getKernels', () => {
            log.debug('PandoraSync: "getKernels" event has been emitted');

            this.worker.send({
                cmd: 'getKernelsRecords'
            });
        });

        this.on('subscribeKernels', (options = {}) => {
            log.debug('PandoraSync: "subscribeKernels" event has been emitted');
            
            this.worker.send({
                cmd: 'subscribeKernels',
                ...options
            });
        });

        this.on('getDatasets', () => {
            log.debug('PandoraSync: "getDatasets" event has been emitted');

            this.worker.send({
                cmd: 'getDatasetsRecords'
            });
        });

        this.on('subscribeDatasets', (options = {}) => {
            log.debug('PandoraSync: "subscribeDatasets" event has been emitted');
            
            this.worker.send({
                cmd: 'subscribeDatasets',
                ...options
            });
        });

        this.on('getJobs', () => {
            log.debug('PandoraSync: "getJobs" event has been emitted');

            this.worker.send({
                cmd: 'getJobsRecords'
            });
        });

        this.on('subscribeJobs', (options = {}) => {
            log.debug('PandoraSync: "subscribeJobs" event has been emitted', options);
            
            this.worker.send({
                cmd: 'subscribeJobs',
                ...options
            });
        });

        this.on('subscribeJobStateChanged', (options = {}) => {
            log.debug('PandoraSync: "subscribeJobStateChanged" event has been emitted', options);

            this.worker.send({
                cmd: 'subscribeJobStateChanged',
                ...options
            });
        });

        this.on('getWorkers', () => {
            log.debug('PandoraSync: "getWorkers" event has been emitted');

            this.worker.send({
                cmd: 'getWorkersRecords'
            });
        });

        this.on('subscribeWorkers', (options = {}) => {
            log.debug('PandoraSync: "subscribeWorkers" event has been emitted', options);
            
            this.worker.send({
                cmd: 'subscribeWorkers',
                ...options
            });
        });

        this.on('subscribeWorkerAddress', (options = {}) => {
            log.debug('PandoraSync: "subscribeWorkerAddress" event has been emitted', options);

            this.worker.send({
                cmd: 'subscribeWorkerAddress',
                ...options
            });
        });

        this.on('unsubscribeWorkerAddress', (options = {}) => {
            log.debug('PandoraSync: "unsubscribeWorkerAddress" event has been emitted', options);

            this.worker.send({
                cmd: 'unsubscribeWorkerAddress',
                ...options
            });
        });

        this.on('getSubscriptionsList', () => {
            log.debug('PandoraSync: "getSubscriptionsList" event has been emitted');

            this.worker.send({
                cmd: 'getSubscriptionsList'
            });
        });
    }

    /**
     * Start synchronizer
     *
     * @param {Object} options
     * @returns {Promise}
     * @memberof PandoraSync
     */
    async start(options = {}) {

        if (this.initialized) {

            this.worker.send({
                cmd: 'start'
            });
            return;
        } 
        
        Object.assign(this.options , options);

        const workerOptions = {
            stdio: ['ipc']
        };

        this.worker = fork(this.options.workerPath || path.resolve(__dirname, 'worker.js'),
            this.options.execArgv, 
            workerOptions);

        this.worker.on('error', err => this.emit('error', err));
        this.worker.on('exit', () => {
            this.initialized = false;
            this.emit('stopped');
        });
        this.worker.on('message', message => this._messageManager(message));
        this.worker.send({
            cmd: 'start'
        });
    }

    /**
     * Stop synchronizer
     *
     * @param {Function} onStop callback
     * @memberof PandoraSync
     */
    stop(onStop = () => {}) {
        this.once('stopped', onStop);
        this.worker.send({
            cmd: 'stop'
        });
    }
}

module.exports = new PandoraSync();
module.exports.PandoraSync = PandoraSync;

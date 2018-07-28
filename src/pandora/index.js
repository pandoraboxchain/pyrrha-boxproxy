'use strict';
const path = require('path');
const { EventEmitter } = require('events');
const { fork } = require('child_process');

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
            execArgv: process.env.NODE_ENV === 'development' ? {
                execArgv: ['--inspect-brk=47977']
            } : undefined
        };

        this._setupOperationsHandlers();
    }

    // IPC messages manager (from the worker)
    _messageManager(message) {

        switch(message.cmd) {
            case 'error':
                this.emit('error', message.error);
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

            case 'lastBlockNumber':
                this.emit('lastBlockNumber', {
                    name: 'lastBlock',
                    blockNumber: message.blockNumber
                });
                break;

            default:
                this.emit('error', new Error('Unknown worker command'));
        }
    }

    // Pandora synchronizer events handlers
    _setupOperationsHandlers() {

        this.on('getKernels', () => {

            this.worker.send({
                cmd: 'getKernelsRecords'
            });
        });

        this.on('subscribeKernels', (options = {}) => {
            
            this.worker.send({
                cmd: 'subscribeKernels',
                ...options
            });
        });

        this.on('getDatasets', () => {

            this.worker.send({
                cmd: 'getDatasetsRecords'
            });
        });

        this.on('subscribeDatasets', (options = {}) => {
            
            this.worker.send({
                cmd: 'subscribeDatasets',
                ...options
            });
        });

        this.on('getJobs', () => {

            this.worker.send({
                cmd: 'getJobsRecords'
            });
        });

        this.on('subscribeJobs', (options = {}) => {
            
            this.worker.send({
                cmd: 'subscribeJobs',
                ...options
            });
        });

        this.on('subscribeJobStateChanged', (options = {}) => {

            this.worker.send({
                cmd: 'subscribeJobStateChanged',
                ...options
            });
        });

        this.on('getWorkers', () => {

            this.worker.send({
                cmd: 'getWorkersRecords'
            });
        });

        this.on('subscribeWorkers', (options = {}) => {
            
            this.worker.send({
                cmd: 'subscribeWorkers',
                ...options
            });
        });

        this.on('subscribeWorkerAddress', (options = {}) => {

            this.worker.send({
                cmd: 'subscribeWorkerAddress',
                ...options
            });
        });

        this.on('unsubscribeWorkerAddress', (options = {}) => {

            this.worker.send({
                cmd: 'unsubscribeWorkerAddress',
                ...options
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

        if (this.started) {

            this.worker.send({
                cmd: 'start'
            });            
        } else {

            Object.assign(this.options , options);

            const workerOptions = {
                stdio: ['ipc']
            };

            this.worker = fork(path.resolve(__dirname, 'worker.js'),
                this.options.execArgv, 
                workerOptions);

            this.worker.on('error', err => this.emit('error', err));
            this.worker.on('exit', () => {
                this.started = false;
                this.emit('stopped');
            });
            this.worker.on('message', message => this._messageManager(message));

            this.worker.send({
                cmd: 'start'
            });
        }
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

const pandoraSync = new PandoraSync();
module.exports = pandoraSync;

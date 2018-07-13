'use strict';
const path = require('path');
const { EventEmitter } = require('events');
const { fork } = require('child_process');
const log = require('../logger');

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

    // IPC messages manager (from worker)
    _messageManager(message) {

        switch(message.cmd) {
            case 'error':
                this.emit('error', message.error);
                break;

            case 'started':
                this.initialized = true;
                this.emit('started');
                break;

            case 'stopped':
                this.initialized = false;
                this.emit('stopped');
                break;

            case 'kernelsRecords':
                this.emit('kernelsRecords', {
                    records: message.records || [],
                    blockNumber: message.blockNumber,
                    baseline: message.baseline || false
                });
                break;

            case 'blockNumber':
                this.emit('blockNumber', {
                    blockNumber: message.blockNumber
                });
                break;

            default:
                this.emit('error', new Error('Unknown worker command'));
        }
    }

    // Pandora synchronizer events handlers
    _setupOperationsHandlers() {

        this.on('getKernels', (options = {}) => {

            this.worker.send({
                cmd: 'getKernelsRecords',
                options
            });
        });

        this.on('subscribeKernels', () => {
            
            this.worker.send({
                cmd: 'subscribeKernels'
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
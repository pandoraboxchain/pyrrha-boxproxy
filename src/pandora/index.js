const path = require('path');
const { EventEmitter } = require('events');
const { fork } = require('child_process');
const log = require('../logger');

class PandoraSync extends EventEmitter {

    constructor() {
        super();
        this.worker = null;
        this.initialized = false;
        this.options = {
            execArgv: process.env.NODE_ENV === 'development' ? {
                execArgv: ['--inspect-brk=47977']
            } : undefined
        };        
    }

    _messageManager(message) {

        switch(message.cmd) {
            case 'error':
                this.emit('error', message.error);
                break;

            case 'started':
                this.emit('started');
                break;

            case 'paused':
                this.emit('paused');
                break;

            default:
                this.emit('error', new Error('Unknown worker command'));
        }
    }

    async start(options = {}) {

        if (this.initialized) {

            this.worker.send({
                cmd: 'start'
            });            
        } else {

            Object.assign(this.options , options);

            this.worker = fork(path.resolve(__dirname, 'worker.js'),
                this.options.execArgv, 
                {
                    stdio: ['ipc']
                });

            this.worker.on('error', err => this.emit('error', err));
            this.worker.on('exit', () => {
                this.initialized = false;
                this.emit('stopped');
            });
            this.worker.on('message', message => this._messageManager(message));

            this.worker.send({
                cmd: 'start'
            });
            this.initialized = true;
            this.emit('initialized');
        }
    }

    pause() {
        this.worker.send({
            cmd: 'pause'
        });
    }

    stop() {
        this.worker.send({
            cmd: 'stop'
        });
    }
}

const pandoraSync = new PandoraSync();
module.exports = pandoraSync;

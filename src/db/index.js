'use strict';
const { EventEmitter } = require('events');
const expect = require('../utils/expect');
const db = require('./db');
const systemModel = require('./models/system');
const configModel = require('./models/config');
const migrator = require('./migrator');
const migrations = require('./seeders');
const api = require('./api');

class PandoraDb extends EventEmitter {

    get api() {
        return api;
    };
    
    constructor() {
        super();
        this.initialized = false;
        this.tasks = [];// tasks config
        this.options = {};

        this.once('initialized', this._setupTasks);
    }

    _setupTasks() {
        this.tasks.map(task => {

            const endpoint = task.action.split('.').reduce((acc, part) => {
                return acc && acc[part] !== undefined ? acc[part] : null;
            }, this.api);

            // Subscribe on provider event
            task.source.on(task.event, data => endpoint(data, {
                ...task.actionOptions,
                source: task.source
            }));
            
            if (task.init) {

                // Send event to provider
                task.source.initialized ? 
                    task.init() :
                    task.source.once('initialized', () => task.init());
            }
        });
    }

    // Initialize the DB
    async init(options = {}) {

        try {
            Object.assign(this.options , options);

            await Promise.all([
                systemModel,
                configModel
            ].map(model => model.sync()));

            await db.authenticate();
            const alreadySeeded = await api.system.isAlreadySeeded();

            if (!alreadySeeded) {

                await migrator({ migrations }).up();
            }
            
            this.initialized = true;
            this.emit('initialized');            
        } catch(err) {
            this.initialized = false;
            this.emit('error', err);
        }

        return this;
    }

    // Gracefully stop the DB
    async stop() {

        try {
            await db.close();
            this.initialized = false;
            this.emit('stopped');
        } catch(err) {
            this.emit('error', err);        
        }
    }

    addtask(options = {}) {
        expect.all(options, {
            name: {
                type: 'string'
            },
            source: {
                type: 'object'
            },
            event: {
                type: 'string'
            },
            action: {
                type: 'member',
                provider: this.api
            },
            actionOptions: {
                type: 'object',
                required: false
            },
            init: {
                type: 'function',
                required: false
            }
        });

        this.tasks.push(options);
    }
}

const pandoraDb = new PandoraDb();
module.exports = pandoraDb;

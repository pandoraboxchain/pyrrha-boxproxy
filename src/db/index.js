'use strict';
const { EventEmitter } = require('events');
const expect = require('../utils/expect');
const db = require('./db');
const migrator = require('./migrator');
const migrations = require('./seeders');
const api = require('./api');

// Models
const systemModel = require('./models/system');
const configModel = require('./models/config');
const kernelsModel = require('./models/kernels');
const datasetsModel = require('./models/datasets');
const jobsModel = require('./models/jobs');
const allModels = [
    systemModel,
    configModel,
    kernelsModel,
    datasetsModel,
    jobsModel
];

/**
 * Pandora database manager
 *
 * @class PandoraDb
 * @extends {EventEmitter}
 * @event initialized
 * @event action
 * @event stopped
 * @event error
 */
class PandoraDb extends EventEmitter {

    /**
     * Api reference getter
     *
     * @readonly
     * @memberof PandoraDb
     */
    get api() {
        return api;
    };
    
    constructor() {
        super();
        this.initialized = false;
        this.tasks = [];// tasks config
        this.options = {};

        this.once('initialized', () => this.tasks.map(task => this._setupTask(task)));
    }

    // Setup a task by config
    _setupTask(task) {
        const endpoint = task.action.split('.').reduce((acc, part) => {
            return acc && acc[part] !== undefined ? acc[part] : null;
        }, this.api);

        if (task.source && task.event && endpoint) {

            // Subscribe on provider event
            task.source.on(task.event, async (data) => {

                try {

                    this.emit('action', {
                        name: task.name,
                        event: task.event,
                        data
                    });
                    
                    // Run task action
                    await endpoint(data, {
                        ...task.actionOptions,
                        source: task.source
                    });
                } catch (err) {

                    this.emit('error', err);
                }
            });
        }

        // Handle the initialization callback
        if (task.init && task.initEvent) {

            if (task.isInitialized) {

                if (task.source[task.isInitialized]) {

                    task.init();
                } else {

                    task.source.once(task.initEvent, task.init);                    
                }                
            } else {

                task.source.once(task.initEvent, task.init);                    
            }            
        }
    }

    /**
     * Initialize the DB
     *
     * @param {Object} options Manager config
     * @returns {Promise}
     * @memberof PandoraDb
     */
    async initialize(options = {}) {

        try {
            Object.assign(this.options , options);

            await Promise.all(allModels.map(model => model.sync()));

            await db.authenticate();
            const alreadySeeded = await api.system.isAlreadySeeded();

            if (!alreadySeeded) {

                // Seeed some initial data
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

    /**
     * Gracefully stop the DB
     *
     * @memberof PandoraDb
     */
    async stop() {

        try {
            await db.close();
            this.initialized = false;
            this.emit('stopped');
        } catch(err) {
            this.emit('error', err);        
        }
    }

    /**
     * Add manager task
     *
     * @param {Object} options Task configuration
     * @memberof PandoraDb
     */
    addTask(options = {}) {
        expect.all(options, {
            name: {
                type: 'string'
            },
            source: {
                type: 'object'
            },
            event: {
                type: 'string',
                required: false
            },
            action: {
                type: 'member',
                provider: this.api,
                required: false
            },
            actionOptions: {
                type: 'object',
                required: false
            },
            isInitialized: {
                type: 'string',
                required: false
            },
            initEvent: {
                type: 'string',
                required: false
            },
            init: {
                type: 'function',
                required: false
            }
        });

        this.tasks.push(options);

        if (this.initialized) {

            this._setupTask(options);
        }
    }
}

const pandoraDb = new PandoraDb();
module.exports = pandoraDb;

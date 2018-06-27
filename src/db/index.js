'use strict';
const { EventEmitter } = require('events');
const db = require('./db');
const systemModel = require('./models/system');
const configModel = require('./models/config');
const migrator = require('./migrator');
const migrations = require('./seeders');
const api = require('./api');

class PandoraDb extends EventEmitter {
    
    constructor() {
        super();
        this.initialized = false;
        this.options = {
            readOnly: false
        };        
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
}

const pandoraDb = new PandoraDb();
module.exports = pandoraDb;

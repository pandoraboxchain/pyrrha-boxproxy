'use strict';
const { EventEmitter } = require('events');

/**
 * Queue manager 
 *
 * @class Queue
 */
class Queue extends EventEmitter {

    /**
     * Getter for the queue storage size
     *
     * @readonly
     * @memberof Queue
     */
    get size() {
        return this._data.length;
    }

    /**
     * Getter for the queue storage data
     *
     * @readonly
     * @memberof Queue
     */
    get data() {
        return this._data;
    }

    /**
     * Creates an instance of Queue
     * 
     * @memberof Queue
     */
    constructor() {
        super();

        this._queue = [];
        this._data = [];
        this._timers = [];
        this._process = false;
        this._termination = false;
    }

    // Reset all registered timers
    _resetTimers() {

        this._timers.forEach(timer => {

            if (timer.id) {

                clearTimeout(timer.id);
            }
        });
        this._timers = this._timers.filter(timer => !timer.resolved);
    }

    /**
     * Reset the queue
     *
     * @memberof Queue
     */
    reset() {

        if (this._process) {

            this.once('stopped', this.reset);
            this._termination = true;
            return;
        }

        this._resetTimers();
        this._queue = [];
        this._data = [];
        this._timers = [];
        this._process = false;
        this.emit('reset');
    }

    /**
     * Take the last records from the queue and process it
     *
     * @memberof Queue
     * @private
     */
    async _take() {

        if (this._queue.length > 0) {

            if (this._termination) {

                this._termination = false;
                return Promise.resolve();
            }

            this._process = true;
            this._resetTimers();

            const item = this._queue[this._queue.length - 1];
            let occurrences = [];

            if (Array.isArray(item.conditions) && item.conditions.length > 0) {

                // Check all conditions
                occurrences = this._data.filter(dataItem => item.conditions.length === item.conditions.reduce((acc, prop) => {

                    if (prop && 
                        dataItem[prop] && 
                        dataItem[prop] ===  item.data[prop]) {
                        
                        // calculating a sum of occurrences
                        return acc + 1;
                    }

                    return acc;
                }, 0));
            }

            if (occurrences.length === 0) {

                if (item.transform) {

                    // Run async transformation for the record
                    item.data = await item.transform(item.data);
                }

                if (item.storage) {

                    // Add data to storage if not disabled
                    this._data.push(item.data);
                }

                this.emit('updated', item.data);                
            } else {

                // All records what not meet conditions just ignored
                this.emit('ignored', item);
            }

            this._queue.pop();

            if (this._queue.length > 0) {

                await this._take();
            } else {

                // Queue is empty so stop the process and run on-stop timers
                this._process = false;
                this._timers.forEach(timer => {

                    timer.id = setInterval(() => {
                        timer.resolve();
                        timer.resolved = true;
                    }, timer.timeout);                        
                });
                this.emit('stopped');
            }
        }
    }

    /**
     * Add record to the queue
     *
     * @param {Object} data Data to be added to the queue
     * @param {[<{String}>]} conditions Array of properties  which are should be unique in the queue storage
     * @param {Function} transform Transformation function what will be called before adding a record to the storage (can be async)
     * @param {boolean} storage Enable or disable queue storage (enabled by default)
     * @memberof Queue
     */
    add(data, conditions, transform = data => data, storage = true) {
        this._resetTimers();
        const record = {
            data,
            conditions,
            transform,
            storage
        };
        this._queue.unshift(record);
        this.emit('queued', record);

        if (!this._process) {

            this._take()
                .catch(err => this.emit('error', err));
        }
    }

    /**
     * Remove element from storage by conditions
     *
     * @param {Object} conditions Removal condition rules
     * @memberof Queue
     */
    remove(conditions = {}) {
        let removedRecord;
        this._data = this._data.filter(record => {
            let matched = 0;
            const keys = Object.keys(conditions); 
            
            keys.forEach(key => {

                if (record[key] === conditions[key]) {

                    matched++;
                }
            });

            if (matched === keys.length) {

                removedRecord = record;
                return false;
            }

            return true;
        });

        if (removedRecord) {

            this.emit('removed', removedRecord);
        }
    }

    /**
     * Registering of the "on-stop" timer.
     * Returns the promise what will be resolved 
     * after a timeout after the queue stopped
     * 
     * @param {Number} timeout Delay after queue stopped
     * @returns {Promise}
     * @memberof Queue
     */
    delay(timeout) {
        return new Promise((resolve) => this._timers.push({
            name: 'delay',
            timeout,
            resolve
        }));
    }
}

module.exports = Queue;

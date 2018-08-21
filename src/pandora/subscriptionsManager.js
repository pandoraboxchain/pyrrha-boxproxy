'use strict';
const log = require('../logger');
const { EventEmitter } = require('events');
const Queue = require('../utils/queue');

/**
 * Subscriptions manager 
 *
 * @class SubscriptionsManager
 */
class SubscriptionsManager extends EventEmitter  {

    constructor() {
        super();

        this.subscriptions = new Queue();
    }

    /**
     * Unsubscribe event(s)
     *
     * @param {Object} message Subscription item object (message object with "events" property)
     * @memberof SubscriptionsManager
     * @private 
     */
    _unsubscribeEvents(message) {
        let unsubscribedEvents = [];

        message.events.forEach(event => {
            unsubscribedEvents.push(event.name);
            event.unsubscribe();
        });

        delete message.events;

        log.debug(`WORKER: events [${unsubscribedEvents.join(',')}"] has been unsubscribed at ${Date.now()}`);
    }

    /**
     * Create new subscription
     *
     * @param {Object} message Process message
     * @param {String[]} conditions Additional condition (message property name)
     * @param {Function} subscriptionCallback
     * @param {Function} onAfter
     * @memberof SubscriptionsManager
     */
    create(message, conditions = [], subscriptionCallback = data => data, onAfter = () => {}) {
        
        this.subscriptions.add(message, conditions, subscriptionCallback, onAfter);
    }

    /**
     * Remove event subscription
     *
     * @param {Object} conditions Removal condition rules
     * @memberof SubscriptionsManager
     */
    remove(conditions = {}) {

        log.debug(`WORKER: going to remove subscription by conditions`, conditions);

        this.subscriptions.remove(conditions);
    }

    /**
     * Refresh (re-subscribe) all subscriptions
     * 
     * @param {Number} blockNumber Block number from which all subscriptions should be re-subscribed
     * @param {Function} subscriptionCallback Higher-order function for making subscriptions
     * @returns {Promise} 
     * @memberof SubscriptionsManager
     */
    refresh(blockNumber, subscriptionCallback = async () => {}) {

        if (this.subscriptions.length === 0) {

            return Promise.resolve();
        }

        return new Promise(async (resolve, reject) => {
            let originSubscriptions = this.subscriptions.data;

            this.subscriptions.once('reset', async () => {

                try {

                    this.subscriptions.delay(50).then(() => {

                        log.debug(`WORKER: all subscriptions have been refreshed at ${Date.now()}`);
                        resolve(this.subscriptions.data);
                    });
        
                    await Promise.all(originSubscriptions.map(message => {
        
                        this._unsubscribeEvents(message);
                                    
                        return subscriptionCallback({
                            ...message,
                            blockNumber
                        });
                    }));
            
                    originSubscriptions = undefined;
                } catch (err) {
        
                    this.emit('error', err);
                    reject(err);
                }
            });

            this.subscriptions.reset();            
        });        
    }

    /**
     * Get subscriptions list
     *  
     * @returns {Object[]} Array of subscriptions
     * @memberof SubscriptionsManager
     */
    getList() {

        const subscriptionsList = [];
        const subscriptions = this.subscriptions.data;

        subscriptions.forEach(message => {

            message.events.forEach(event => subscriptionsList.push({
                name: event.name,
                cmd: message.cmd,
                fromBlock: message.blockNumber,
                arguments: event.arguments
            }));
        });

        return subscriptionsList;
    }
}

module.exports = SubscriptionsManager;

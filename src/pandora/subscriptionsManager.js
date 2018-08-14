'use strict';
const log = require('../logger');

/**
 * Subscriptions manager 
 *
 * @class SubscriptionsManager
 */
class SubscriptionsManager {

    constructor() {
        this.subscriptions = [];
    }

    /**
     * Generate unique id for subscriptions
     *
     * @returns {[<{String}>]} Array of affected events names
     * @memberof SubscriptionsManager
     * @private 
     */
    _guId() {

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            let r = Math.random() * 16|0; 
            let v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

    /**
     * Unsubscribe event(s)
     *
     * @param {Object} subscriptionItem Subscription item object
     * @returns {[<{String}>]} Array of affected events names
     * @memberof SubscriptionsManager
     * @private 
     */
    _unsubscribeEvent(subscriptionItem) {

        if (Array.isArray(subscriptionItem.subscription)) {

            // Events can be complex (like "cognitiveJobStateChanged")
            subscriptionItem.subscription.forEach(subItem => subItem.unsubscribe());
        } else {

            subscriptionItem.subscription.unsubscribe();
        }

        log.debug(`WORKER: event "${subscriptionItem.name}" has been unsubscribed at ${Date.now()}`);
    }

    /**
    * Check is event already subscribed
    *
    * @param {String} eventName Condition property (event name name)
    * @param {Object} message Process message
    * @param {String} addProp Additional condition property (optional)
    * @returns {Boolean} 
    * @memberof SubscriptionsManager
    */
    isSubscribed(eventName, message, addProp = null) {
        let subscribed = false;

        const validateSubscription = (subscription, item) => {

            if (subscription.name === eventName) {
    
                if (addProp && item[addProp] !== message[addProp]) {
                    
                    subscribed = false;
                    return;
                }
                
                subscribed = true;
            }
        };
    
        this.subscriptions.forEach(item => {

            if (Array.isArray(item.subscription)) {

                item.subscription.forEach(subItem => validateSubscription(subItem, item));
            } else {

                validateSubscription(item.subscription, item);
            }            
        });
    
        return subscribed;
    }

    /**
     * Register event in subscriptions list
     * 
     * Template for subscription object:
     * {
     *      id: <String>,          // Unique Id
     *      cmd: {String},         // Process message cmd (part of message object)
     *      blockNumber: {Number}, // Block number from which the event is listen to (part of message object)
     *      name: {String},        // Event name (see pyrrha-js)
     *      event: {Object}        // Web3 event object
     * }
     *
     * @param {Object} message Process message
     * @param {[<{Object}>]} events Events objects to be registered (kind of sourceEventName)
     * @memberof SubscriptionsManager
     */
    register(message, ...events) {

        events.forEach(item => {            
            const isComplexEvent = Array.isArray(item.event);

            const subscriptionObject = {
                id: this._guId(),
                name: isComplexEvent ? item.event.map(subEvent => subEvent.name).join('&') : item.event.name,
                subscription: item.event,
                ...message
            };

            this.subscriptions.push(subscriptionObject);

            log.debug(`WORKER: subscription on event "${subscriptionObject.name}" has been registered at ${Date.now()}`);
        });
    }

    /**
     * Remove event subscription
     *
     * @param {String} eventName Event name
     * @param {Object} message Process message
     * @param {String} cmdProp Additional removal condition (message property name)
     * @memberof SubscriptionsManager
     */
    remove(eventName, message, cmdProp = null) {

        log.debug(`WORKER: going to remove subscription for "${eventName}"`);

        const validateSubscription = (subscription, item) => {

            if (subscription.name === eventName) {
    
                if (cmdProp && item[cmdProp] !== message[cmdProp]) {
                    
                    return false;
                }
                
                this._unsubscribeEvent(item);
                log.debug(`WORKER: subscription on "${item.name}" has been removed`);
                return true;
            }
        };

        this.subscriptions = this.subscriptions.filter(item => {
            let isKept = true;

            if (Array.isArray(item.subscription)) {
                

                item.subscription.forEach(subItem => {
                    
                    if (validateSubscription(subItem, item)) {

                        isKept = false;
                        return;
                    }
                });
            } else if (validateSubscription(item.subscription, item)) {

                isKept = false;
            }
                            
            return isKept;
        });
    }

    /**
     * Refresh (re-subscribe) all subscriptions
     * 
     * @param {Number} blockNumber Block number from which all subscriptions should be re-subscribed
     * @param {Function} subscriptionCallback Higher-order function for making subscriptions
     * @returns {Promise} 
     * @memberof SubscriptionsManager
     */
    async refresh(blockNumber, subscriptionCallback = async () => {}) {

        if (this.subscriptions.length === 0) {

            return Promise.resolve();
        }

        let originSubscriptions = this.subscriptions;
        this.subscriptions = [];

        await Promise.all(originSubscriptions.map(message => {
            this._unsubscribeEvent(message);
            
            return subscriptionCallback({
                ...message,
                blockNumber
            });
        }));

        originSubscriptions = undefined;

        log.debug(`WORKER: all subscriptions have been refreshed at ${Date.now()}`);
    }

    /**
     * Get subscriptions list
     *  
     * @returns {[<{Object}>]} Array of subscriptions
     * @memberof SubscriptionsManager
     */
    getList() {

        const subscriptionsList = [];

        this.subscriptions.forEach(item => {

            if (Array.isArray(item.subscription)) {

                item.subscription.forEach(subItem => subscriptionsList.push({
                    id: item.id,
                    name: subItem.name,
                    cmd: item.cmd,
                    fromBlock: item.blockNumber,
                    arguments: subItem.arguments
                }));
            } else {

                subscriptionsList.push({
                    id: item.id,
                    name: item.name,
                    cmd: item.cmd,
                    fromBlock: item.blockNumber,
                    arguments: item.subscription.arguments
                })
            }
        });

        return subscriptionsList;
    }
}

module.exports = SubscriptionsManager;

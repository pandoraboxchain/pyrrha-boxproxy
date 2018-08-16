'use strict';

const { expect } = require('chai');
const SubscriptionsManager = require('../../src/pandora/subscriptionsManager');

describe('Subscriptions manager tests', () => {
    let subscriptions;

    before(() => {
        subscriptions = new SubscriptionsManager();
    });

    it('#create should create new subscription without duplicates', async () => {
        const subscriptionMessage = {
            cmd: 'doSubscribeTestEvent',
            blockNumber: 1234567
        };

        const createEvent = async message => {
            return {
                event: [
                    {
                        name: 'TestCreateEvent',
                        arguments: [
                            {
                                topics: [
                                    'blablabla'
                                ],
                                address: '0x00'
                            }
                        ],
                        unsubscribe: () => {}
                    }
                ]
            };
        };

        await (() => new Promise(resolve => {

            subscriptions.subscriptions.delay(50).then(resolve);
    
            subscriptions.create(subscriptionMessage, ['cmd'], async (message) => {
                const event = await createEvent(message);
                return {
                    ...message,
                    events: event.event
                };
            });

        }))();

        const subscriptionsList1 = subscriptions.getList();

        let isSomethingIgnored = false;
        subscriptions.subscriptions.once('ignored', () => { isSomethingIgnored = true; });

        await (() => new Promise(resolve => {

            subscriptions.subscriptions.delay(50).then(resolve);

            subscriptions.create(subscriptionMessage, ['cmd'], async (message) => {
                const event = await createEvent(message);
                return {
                    ...message,
                    events: event.event
                };
            });
    
            subscriptions.create(subscriptionMessage, ['cmd'], async (message) => {
                const event = await createEvent(message);
                return {
                    ...message,
                    events: event.event
                };
            });

        }))();

        const subscriptionsList2 = subscriptions.getList();

        expect(isSomethingIgnored).to.be.true;
        expect(subscriptionsList1.length === subscriptionsList2.length).to.be.true;
    });

    it('#remove should remove previously registered event', async () => {
        const subscriptionMessage = {
            cmd: 'doSubscribeTestEvent2',
            blockNumber: 1234567
        };

        const createEvent = async message => {
            return {
                event: [
                    {
                        name: 'TestCreateEvent2',
                        arguments: [
                            {
                                topics: [
                                    'blablabla2'
                                ],
                                address: '0x002'
                            }
                        ],
                        unsubscribe: () => {}
                    }
                ]
            };
        };

        let removedRecord;

        await (() => new Promise(resolve => {

            subscriptions.subscriptions.delay(50).then(resolve);
            subscriptions.subscriptions.once('removed', record => { removedRecord = record; });
    
            subscriptions.create(subscriptionMessage, ['cmd'], async (message) => {
                const event = await createEvent(message);
                return {
                    ...message,
                    events: event.event
                };
            });

        }))();

        subscriptions.remove({
            cmd: 'doSubscribeTestEvent2'
        });
        
        expect(removedRecord).to.be.an('object');
        expect(removedRecord.cmd).to.be.equal('doSubscribeTestEvent2');
    });

    it('#refresh should re-subscribe all subscriptions', async () => {
        const subscriptionMessage = {
            cmd: 'doSubscribeTestEvent5',
            blockNumber: 1234567
        };

        const createEvent = async message => {
            
            return {
                event: [
                    {
                        name: message.cmd,
                        arguments: [
                            {
                                topics: [
                                    'blablabla5'
                                ],
                                address: '0x005'
                            }
                        ],
                        unsubscribe: () => {}
                    }
                ]
            };
        };
        
        const subscriptionCallback = async (message) => {

            subscriptions.create(message, ['cmd'], async (message) => {

                const event = await createEvent(message);
                return {
                    ...message,
                    events: event.event
                };
            });
        };

        await (() => new Promise(resolve => {

            subscriptions.subscriptions.delay(50).then(resolve);
                
            subscriptions.create(subscriptionMessage, ['cmd'], async (message) => {
                const event = await createEvent(message);
                return {
                    ...message,
                    events: event.event
                };
            });

        }))();
        
        const subscriptionsList1 = subscriptions.getList();
        //console.log('===', subscriptionsList1)
        
        await subscriptions.refresh(5678901, subscriptionCallback);
        const subscriptionsList2 = subscriptions.getList();

        //console.log('===', subscriptionsList2)

        expect(subscriptionsList1.length === subscriptionsList2.length).to.be.true;
        expect(subscriptionsList1[0].fromBlock).to.be.equal(1234567);
        expect(subscriptionsList2[0].fromBlock).to.be.equal(5678901);
    });
    
});



'use strict';

const { expect } = require('chai');
const SubscriptionsManager = require('../../src/pandora/subscriptionsManager');

describe('Subscriptions manager tests', () => {
    let subscriptions;

    before(() => {
        subscriptions = new SubscriptionsManager();
    });

    it('#_guId should generate unique Id string', () => {
        const id1 = subscriptions._guId();
        const id2 = subscriptions._guId();
        expect(id1).to.be.a('string');
        expect(id2).to.be.a('string');
        expect(id1 !== id2).to.be.true;
    });

    it('#register should register a new event subscription', async () => {
        const subscriptionMessage = {
            cmd: 'doSubscribeTestEvent',
            blockNumber: 1234567
        };
        const eventObj = {
            event: {
                name: 'TestEvent',
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
        };
        subscriptions.register(subscriptionMessage, eventObj);
        expect(subscriptions.isSubscribed('TestEvent')).to.be.true;

        const subscriptionsList = subscriptions.getList();
        expect(subscriptionsList.length > 0).to.be.true;
    });

    it('#register should be able to register a new complex event subscription', async () => {
        const subscriptionMessage = {
            cmd: 'doSubscribeComplexEvent',
            blockNumber: 1234567
        };
        const eventObj = {
            event: [// In complex events "event" property is array of web3 events
                {
                    name: 'ComplexEvent1',
                    arguments: [
                        {
                            topics: [
                                'blablabla3'
                            ],
                            address: '0x003'
                        }
                    ],
                    unsubscribe: () => {}
                },
                {
                    name: 'ComplexEvent2',
                    arguments: [
                        {
                            topics: [
                                'blablabla4'
                            ],
                            address: '0x004'
                        }
                    ],
                    unsubscribe: () => {}
                }
            ]
        };
        subscriptions.register(subscriptionMessage, eventObj);
        expect(subscriptions.isSubscribed('ComplexEvent1')).to.be.true;
        expect(subscriptions.isSubscribed('ComplexEvent2')).to.be.true;        
    });

    it('#remove should remove previously registered event', async () => {
        const subscriptionMessage = {
            cmd: 'doSubscribeTestEvent2',
            blockNumber: 1234567
        };
        const eventObj = {
            event: {
                name: 'TestEvent2',
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
        };
        subscriptions.register(subscriptionMessage, eventObj);
        expect(subscriptions.isSubscribed('TestEvent2')).to.be.true;

        subscriptions.remove('TestEvent2');
        expect(subscriptions.isSubscribed('TestEvent2')).to.be.false;
    });

    it('#isSubscribed should detect registered event WITH CONDITION', async () => {
        const subscriptionMessage = {
            cmd: 'doSubscribeTestEventWithAddress',
            address: 'TESTADDRESS',
            blockNumber: 1234567
        };
        const eventObj = {
            event: {
                name: 'TestEventAddr',
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
        };
        subscriptions.register(subscriptionMessage, eventObj);
        expect(subscriptions.isSubscribed('TestEventAddr', subscriptionMessage, 'address')).to.be.true;
    });

    it('#remove should remove previously registered COMPLEX event', async () => {
        const subscriptionMessage = {
            cmd: 'doSubscribeComplexEvent2',
            blockNumber: 1234567
        };
        const eventObj = {
            event: [
                {
                    name: 'ComplexEvent3',
                    arguments: [
                        {
                            topics: [
                                'blablabla3'
                            ],
                            address: '0x003'
                        }
                    ],
                    unsubscribe: () => {}
                },
                {
                    name: 'ComplexEvent4',
                    arguments: [
                        {
                            topics: [
                                'blablabla4'
                            ],
                            address: '0x004'
                        }
                    ],
                    unsubscribe: () => {}
                }
            ]
        };
        subscriptions.register(subscriptionMessage, eventObj);
        expect(subscriptions.isSubscribed('ComplexEvent3')).to.be.true;

        subscriptions.remove('ComplexEvent3');
        expect(subscriptions.isSubscribed('ComplexEvent3')).to.be.false;
    });

    it('#refresh should re-subscribe all subscriptions', async () => {
        const subscriptionMessage = {
            cmd: 'doSubscribeTestEvent5',
            blockNumber: 1234567
        };
        
        const subscriptionCallback = async (message) => {

            const eventObj = {
                event: {
                    name: message.doSubscribeTestEvent5,
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
            };

            subscriptions.register(message, eventObj);
        };

        await subscriptionCallback(subscriptionMessage);
        const subscriptionsList1 = subscriptions.getList();
        
        await subscriptions.refresh(5678901, subscriptionCallback);
        const subscriptionsList2 = subscriptions.getList();

        expect(subscriptionsList1.length === subscriptionsList2.length).to.be.true;
        expect(subscriptionsList1[0].fromBlock).to.be.equal(1234567);
        expect(subscriptionsList2[0].fromBlock).to.be.equal(5678901);
    });
});

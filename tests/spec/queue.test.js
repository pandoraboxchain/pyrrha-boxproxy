'use strict';
const { expect } = require('chai');
const Queue = require('../../src/utils/queue');
const guid = require('./helpers/guid');

describe('Queue tests', () => {
    
    it('#add should add messages without conditions', async () => {
        const queue = new Queue();        
        const message = {
            event: {},
            blockNumber: 1234567
        };

        let isSomethingQueued = false;
        queue.once('queued', () => { isSomethingQueued = true; });

        let isUpdated = false;
        queue.once('updated', () => { isUpdated = true; });

        let isStopped = false;
        queue.once('stopped', () => { isStopped = true; });

        Array.from(Array(100).keys()).map(index => setTimeout(() => {
            queue.add({
                ...message,
                index
            });
        }, Math.floor(Math.random() * 50)));

        await queue.delay(55);

        expect(queue.size).to.be.equal(100);
        expect(isSomethingQueued).to.be.true;
        expect(isUpdated).to.be.true;
        expect(isStopped).to.be.true;
    });

    it('#add should add unique messages only with conditions', async () => {
        const queue = new Queue();        
        const messages = [
            {
                address: 'aaa',//*
                name: 'zzz',
                event: {},
                blockNumber: 1234567
            },
            {
                address: 'bbb',//*
                name: 'test',
                event: {},
                blockNumber: 1234567
            },
            {
                address: 'aaa',
                name: 'zzz',
                event: {},
                blockNumber: 1234567
            },
            {
                address: 'bbb',
                name: 'test',
                event: {},
                blockNumber: 1234567
            },
            {
                address: 'aaa',//*
                name: 'test',
                event: {},
                blockNumber: 1234567
            },
            {
                address: 'bbb',//*
                name: 'zzz',
                event: {},
                blockNumber: 1234567
            },
            {
                address: 'aaa',
                name: 'test',
                event: {},
                blockNumber: 1234567
            },
            {
                address: 'bbb',
                name: 'zzz',
                event: {},
                blockNumber: 1234567
            }
        ];

        let isSomethingIgnored = false;
        queue.once('ignored', () => { isSomethingIgnored = true; });

        messages.map(message => setTimeout(() => {
            queue.add(message, ['address', 'name']);
        }, Math.floor(Math.random() * 110)));

        await queue.delay(120);

        expect(queue.size).to.be.equal(4);
        expect(isSomethingIgnored).to.be.true;
    });

    it('#add should add messages with async transforming', async () => {
        const queue = new Queue();        
        const message = {
            blockNumber: 1234567
        };

        Array.from(Array(10).keys()).map(index => setTimeout(() => {
            queue.add({
                ...message,
                index
            }, 'index', message => new Promise(resolve => setTimeout(() => resolve({
                ...message,
                event: {
                    id: guid()
                }
            }), 5)));
        }, Math.floor(Math.random() * 50)));

        await queue.delay(55);

        expect(queue.size).to.be.equal(10);
    });

    it('#add should add messages with async transforming and bypassed a storage if option been provided', async () => {
        const queue = new Queue();        
        const message = {
            blockNumber: 1234567
        };

        Array.from(Array(5).keys()).map(index => setTimeout(() => {
            queue.add({
                    ...message,
                    index
                }, 'index',
                message => new Promise(resolve => setTimeout(() => resolve({
                    ...message,
                    event: {
                        id: guid()
                    }
                }), 5)), false);
            }, Math.floor(Math.random() * 50)));

        await queue.delay(55);

        expect(queue.size).to.be.equal(0);
    });

    it('#reset should reset the queue', async () => {
        const queue = new Queue();        
        const message = {
            blockNumber: 1234567
        };

        Array.from(Array(10).keys()).map(index => setTimeout(() => {
            queue.add({
                ...message,
                index
            }, 'index', message => new Promise(resolve => setTimeout(() => resolve({
                ...message,
                event: {
                    id: guid()
                }
            }), 5)));
        }, Math.floor(Math.random() * 50)));

        await (() => new Promise(resolve => {
            queue.once('reset', resolve);
            queue.reset();
        }))();

        expect(queue.size).to.be.equal(0);
    });

    it('#remove should remove storage record by conditions', async () => {
        const queue = new Queue();
        const message = {
            blockNumber: 1234567
        };

        Array.from(Array(10).keys()).map(index => setTimeout(() => {
            queue.add({
                ...message,
                index
            }, 'index', message => new Promise(resolve => setTimeout(() => resolve({
                ...message,
                event: {
                    id: guid()
                }
            }), 5)));
        }, Math.floor(Math.random() * 50)));

        await queue.delay(55);

        let removedRecord;
        queue.once('removed', record => { removedRecord = record; });

        queue.remove({
            index: 5
        });

        expect(queue.size).to.be.equal(9);
        expect(removedRecord).to.be.an('object');
        expect(removedRecord.index).to.be.equal(5);
    });
});

'use strict';
const { EventEmitter } = require('events');
const { expect } = require('chai');
const db = require('../../src/db');

// Simple event emitter
class TestEvetsProvider extends EventEmitter {

    constructor() {
        super();
        this.initalized = true;
    }
}

describe('Database module tests', () => {
    const config = {};
    let testProv = new TestEvetsProvider();

    before(done => {
        const timeout = setTimeout(() => done(new Error('"initialized" event not emitted on start')), 5000);
        db.once('initialized', () => {
            clearTimeout(timeout);
            done();
        });
        db.initialize(config).catch(done);
    });

    // after(async () => await db.stop());

    it('db should prepopulate some system properties on setup', async () => {
        const system = await db.api.system.getAll();
        expect(Array.isArray(system.rows)).to.be.true;
        const alreadySeeded = system.rows.filter(rec => rec.name === 'alreadySeeded')[0];
        expect(alreadySeeded.value).to.be.equal('yes');
        const kernelsBaseline = system.rows.filter(rec => rec.name === 'kernelsBaseline')[0];
        expect(kernelsBaseline.value).to.be.equal('no');
    });

    it('db should handle error event', done => {
        db.once('error', err => {
            expect(err.message).to.be.equal('Test error');
            done();
        });
        db.emit('error', new Error('Test error'));
    });

    it('#addTask should throw an error if wrong options set has been provided', () => {
        expect(() => db.addtask({
            name: 'watchBlockNumber',
            wrong: null
        })).to.throw();
    });

    it('#addTask should throw an error if wrong action member has been passed', () => {
        expect(() => db.addtask({
            name: 'watchBlockNumber',
            source: testProv,
            event: 'blockNumber',
            action: 'system.wrongMemberFunction'
        })).to.throw();
    });

    it('#addTask should create and handle a simple task', done => {
        let doneCalled = false;
        const timeout = setTimeout(() => {

            if (doneCalled) {
                return;
            }

            done(new Error('watchBlockNumber task not been handled during timeout'));
            doneCalled = true;
        }, 7000);

        db.once('error', err => {
            clearTimeout(timeout);

            if (doneCalled) {
                return;
            }

            done(new Error(err.message));
            doneCalled = true;
        });
        db.once('action', async (data) => {

            try {

                clearTimeout(timeout);
                expect(data.name).to.be.equal('watchBlockNumber');
                expect(data.event).to.be.equal('lastBlockNumber');
                expect(data.data).to.be.an('object');
                const bn = await db.api.system.getBlockNumber('lastBlock');
                expect(bn).to.be.equal(12345);  

                done();
                doneCalled = true;
            } catch (err) {

                clearTimeout(timeout);

                if (doneCalled) {
                    return;
                }

                done(err);
                doneCalled = true;
            }            
        });

        db.addTask({
            name: 'watchBlockNumber',
            source: testProv,
            event: 'lastBlockNumber',
            action: 'system.saveBlockNumber',
            initEvent: 'started',
            isInitialized: 'initialized',
            init: () => {

                testProv.emit('lastBlockNumber', {
                    name: 'lastBlock',
                    blockNumber: 12345
                });
            }
        });

        testProv.emit('started');
    });

    it('#addTask should create and handle a task with custom action', done => {
        let doneCalled = false;
        const timeout = setTimeout(() => {

            if (doneCalled) {
                return;
            }            
            
            done(new Error('watchBlockNumber task not been handled during timeout useing custom action'));
            doneCalled = true;
        }, 7000);
    
        db.once('error', err => {
            clearTimeout(timeout);

            if (doneCalled) {
                return;
            }

            done(new Error(err.message));
            doneCalled = true;
        });
        db.once('action', async (data) => {

            try {

                clearTimeout(timeout);
                expect(data.name).to.be.equal('watchBlockNumber');
                expect(data.event).to.be.equal('lastBlockNumber');
                expect(data.data).to.be.an('object');
                const bn = await db.api.system.getBlockNumber('veryLastBlock');
                expect(bn).to.be.equal(12345); 

                done();
                doneCalled = true;
            } catch (err) {

                clearTimeout(timeout);

                if (doneCalled) {
                    return;
                }

                done(err);
                doneCalled = true;
            }            
        });

        db.addTask({
            name: 'watchBlockNumber',
            source: testProv,
            event: 'lastBlockNumber',
            action: async (data) => {
                await db.api.system.saveBlockNumber(data);                    
            },
            initEvent: 'started',
            isInitialized: 'initialized',
            init: () => {
    
                testProv.emit('lastBlockNumber', {
                    name: 'veryLastBlock',
                    blockNumber: 12345
                });
            }
        });

        setTimeout(() => testProv.emit('started'), 500);        
    });

});

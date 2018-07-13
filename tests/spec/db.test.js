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
        const timeout = setTimeout(() => done(new Error('"initialized" event not emitted on start')), 1000);
        db.once('initialized', () => {
            clearTimeout(timeout);
            done();
        });
        db.initialize(config).catch(done);
    });

    after(async () => await db.stop());

    it('db should prepopulate some system properties on setup', async () => {
        const system = await db.api.system.getAll();
        expect(Array.isArray(system)).to.be.true;
        const alreadySeeded = system.filter(rec => rec.name === 'alreadySeeded')[0];
        expect(alreadySeeded.value).to.be.equal('yes');
        const kernelsBaseline = system.filter(rec => rec.name === 'kernelsBaseline')[0];
        expect(kernelsBaseline.value).to.be.equal('no');
        const blockNumber = system.filter(rec => rec.name === 'blockNumber')[0];
        expect(blockNumber.value).to.be.equal('0');
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
        const timeout = setTimeout(() => done(new Error('Simple task not been handled during timeout')), 2000);

        db.once('action', async (data) => {

            try {

                expect(data.name).to.be.equal('watchBlockNumber');
                expect(data.event).to.be.equal('blockNumber');
                expect(data.data).to.be.an('object');
                const bn = await db.api.system.getBlockNumber();
                expect(bn).to.be.equal(12345);
                clearTimeout(timeout);
                done();
            } catch (err) {

                clearTimeout(timeout);
                done(err);
            }            
        });

        db.addTask({
            name: 'watchBlockNumber',
            source: testProv,
            event: 'blockNumber',
            action: 'system.saveBlockNumber',
            initEvent: 'started',
            isInitialized: 'initialized',
            init: () => {

                testProv.emit('blockNumber', {
                    blockNumber: 12345
                });
            }
        });

        testProv.emit('started');
    });
});

'use strict';

const { expect } = require('chai');
const StateManager = require('../../src/pandora/stateManager');

describe('State manager tests', () => {
    const PAN_STARTED = 'PAN_STARTED';
    const PAN_STOPPED = 'PAN_STOPPED';
    const PAN_PAUSED = 'PAN_PAUSED';
    const PAN_KERNELS_BASELINE = 'PAN_KERNELS_BASELINE';
    const PAN_KERNELS_UNSUBSCRIBED = 'PAN_KERNELS_UNSUBSCRIBED';
    const PAN_KERNELS_SUBSCRIBED = 'PAN_KERNELS_SUBSCRIBED';

    const stateModel = {
        pan: {
            [PAN_STOPPED]: [PAN_STARTED],
            [PAN_STARTED]: [PAN_PAUSED, PAN_STOPPED],
            [PAN_PAUSED]: [PAN_STARTED, PAN_STOPPED]
        },
        kernels: {
            [PAN_KERNELS_BASELINE]: [PAN_KERNELS_UNSUBSCRIBED],
            [PAN_KERNELS_UNSUBSCRIBED]: [PAN_KERNELS_SUBSCRIBED, PAN_KERNELS_BASELINE],
            [PAN_KERNELS_SUBSCRIBED]: [PAN_KERNELS_UNSUBSCRIBED]
        }
    };

    const stateConditions = {
        [PAN_KERNELS_BASELINE]: {
            pan: [PAN_STARTED]
        },
        [PAN_KERNELS_UNSUBSCRIBED]: {
            pan: [PAN_STARTED, PAN_PAUSED]
        },
        [PAN_KERNELS_SUBSCRIBED]: {
            pan: [PAN_STARTED]
        }
    };

    let state;

    before('Create StateManager instance', () => {
        state = new StateManager({
            model: stateModel,
            conditions: stateConditions,
            state: {
                pan: PAN_STOPPED,
                kernels: PAN_KERNELS_BASELINE
            }
        });
    });

    it('#set should change "pan" state to PAN_STARTED', async () => {
        await state.set({
            pan: PAN_STARTED
        });
        expect(state.get('pan')).to.be.equal(PAN_STARTED);
    });

    it('#set should fail on trying to set wrong state', async () => {        
        state.set({
            pan: 'UNKNOWN_STATE'
        })
        .catch(err => expect(err).to.be.an.instanceof(Error));
    });

    it('#set should should fail on trying to set a state with non-matched conditions', async () => {
        await state.set({
            pan: PAN_STOPPED
        });
        await state.set({
            kernels: PAN_KERNELS_UNSUBSCRIBED
        })
        .catch(err => expect(err).to.be.an.instanceof(Error));
    });

    it('#get should throw an error is trying to get unknown state', done => {
        try {
            let wrong = state.get('unknown');
            done(new Error('Failed'));
        } catch (err) {
            expect(err).to.be.an.instanceof(Error);
            done();
        }
    });
});

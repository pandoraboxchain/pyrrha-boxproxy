'use strict';
const log = require('../../logger');
const store = require('../../store');

const {
    api: {
        web3
    }
} = store.get('pjs');

module.exports = push => {

    web3.eth.getBlockNumber()
        .then(number => {
            store.set('lastBlock', number);
            web3.eth.subscribe('newBlockHeaders')
                .on('data', data => store.set('lastBlock', data.number))
                .on('error', log.debug);
        })
        .catch(log.error);
};

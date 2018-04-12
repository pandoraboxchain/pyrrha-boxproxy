'use strict';
const debug = require('debug')('boxproxy:events');
const store = require('../../store');

const {
    api: {
        web3
    }
} = store.get('pjs');

module.exports = push => {

    // we need to subscribe to new block headers 
    // to prevent websocket disconnecting in case of long inactivity of boxproxy
    web3.eth.subscribe('newBlockHeaders')
        .on('data', () => {})
        .on('error', debug);    
};

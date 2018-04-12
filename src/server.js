'use strict';

const debug = require('debug')('boxproxy');
const Pjs = require('pyrrha-js');
const store = require('./store');

module.exports = config => {

    // Init servers
    const wsServer = require('./ws')(config);
    const app = require('./express')(config);
    const url = `${config.protocol}://${config.nodeHost}${config.nodePort ? ':' + config.nodePort : ''}`;

    debug(`Connected to: ${config.provider ? config.provider.connection.url : url}`);

    const pjs = new Pjs({
        eth: {
            provider: config.provider || new Pjs.Web3.providers.WebsocketProvider(url)
        },
        contracts: config.contracts,
        addresses: config.addresses
    });

    // Set global app variables
    store.set('app', app);
    store.set('web3', pjs.api.web3);
    store.set('ws', wsServer);
    store.set('pjs', pjs);

    // Init RESTful and WS APIs
    require('./routes')(app);
    require('./wsapi')(wsServer);

    return store;
};

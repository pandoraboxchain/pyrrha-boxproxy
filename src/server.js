'use strict';

const log = require('./logger');
const Pjs = require('pyrrha-js');
const store = require('./store');

let watchInterval;
let connectionTimeout;
let reConnectionTimeout;
let isReconnecting = false;

const watchWsConnection = (options = {}) => {
    log.info('Start watching for WS connection');
    
    const web3 = store.get('web3');
    const provider = web3.currentProvider;
    const url = provider.connection.url;
    const origOnclose = provider.connection.onclose;
    isReconnecting = false;
        
    const tryReconnect = (resetStatus = false) => {

        clearInterval(watchInterval);
        clearTimeout(connectionTimeout);
        clearTimeout(reConnectionTimeout);

        if (resetStatus) {
            isReconnecting = false;
        }
        
        if (!isReconnecting) {

            isReconnecting = true;
            log.info(`Start WS reconnection from block #${store.get('lastBlock')}`);

            reConnectionTimeout = setTimeout(() => {
                log.info('Reconnection timeout exceeded. Trying to reconnect again');
                tryReconnect(true);
            }, options.timeout || 5000);

            web3.setProvider(new Pjs.Web3.providers.WebsocketProvider(url));
            web3.eth.getBlockNumber()
                .then(number => {
                    log.info(`Reconnection is done at block #${number}. Resume watching for a connection`);
                    clearTimeout(reConnectionTimeout);
                    require('./wsapi')(store.get('ws'));
                    log.info('Events listeners was refreshed');
                    watchWsConnection(options);
                })
                .catch(err => {
                    log.error(`Reconnection is failed with error: ${err.message}. Trying to reconnect again`);
                    tryReconnect();
                });
        }        
    };

    provider.connection.onclose = () => {
        origOnclose();
        tryReconnect();
    };

    watchInterval = setInterval(() => {
        
        if (isReconnecting) {
            return;
        }
        
        if (provider.connection.readyState === provider.connection.CLOSED) {
            
            log.info('Closed connection detected. Trying to reconnect');
            return tryReconnect(true);
        }

        if (!connectionTimeout || connectionTimeout._destroyed) {

            connectionTimeout = setTimeout(() => {
                log.info('Connection timeout exceeded. Trying to reconnect');
                tryReconnect(true);
            }, options.timeout || 5000);

            web3.eth.getBlockNumber()
                .then(number => {
                    log.info(`Latest block: ${number}`);
                    clearTimeout(connectionTimeout);
                })
                .catch(err => {

                    if (!isReconnecting) {
                        
                        log.error(`Error ocurred: ${err.message}. Trying to reconnect`);
                        tryReconnect(true);
                    }
                });
        }
    }, 2000);
};

module.exports.createServer = config => {

    // Init servers
    const wsServer = require('./ws')(config);
    const app = require('./express')(config);

    if (!config.provider) {

        const url = `${config.protocol}://${config.nodeHost}${config.nodePort ? ':' + config.nodePort : ''}`;
        config.provider = new Pjs.Web3.providers.WebsocketProvider(url);
    }

    const pjs = new Pjs({
        eth: {
            provider: config.provider || new Pjs.Web3.providers.WebsocketProvider(url)
        },
        contracts: config.contracts,
        addresses: config.addresses
    });

    log.info(`Connected to: ${config.provider.connection.url}`);

    // Set global app variables
    store.set('app', app);
    store.set('web3', pjs.api.web3);
    store.set('ws', wsServer);
    store.set('pjs', pjs);

    // Init RESTful and WS APIs
    require('./routes')(app);
    require('./wsapi')(wsServer);

    watchWsConnection({ timeout: config.wstimeout });

    return store;
};

module.exports.close = (callback = () => {}) => {
    log.info('Going to close the server');

    clearInterval(watchInterval);
    clearTimeout(connectionTimeout);
    clearTimeout(reConnectionTimeout);
    log.info('All timeouts has been cleared');

    store.get('ws').close(() => {
        log.info('Ws server has been closed');

        store.get('express').close(() => {
            log.info('Express server has been closed');

            setTimeout(callback, 50);
        });
    });       
};

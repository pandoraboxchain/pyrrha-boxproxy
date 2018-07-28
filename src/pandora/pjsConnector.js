'use strict';
const { EventEmitter } = require('events');
const Pjs = require('pyrrha-js');
const StateManager = require('./stateManager');

// Pjs states
const PJS_STOPPED = 'PJS_STOPPED';
const PJS_CONNECTING = 'PJS_CONNECTING';
const PJS_CONNECTED = 'PJS_CONNECTED';

/**
 * Handle Pjs connection
 *
 * @class PjsConnector
 * @extends {EventEmitter}
 * @event error
 * @event lastBlockNumber
 * @event reconnected
 */
class PjsConnector extends EventEmitter {

    /**
     * Creates an instance of PjsConnector
     * 
     * @memberof PjsConnector
     */
    constructor() {
        super();
        this.state = null;
        this.config = {
            protocol: 'wss',
            host: 'localhost',
            port: 8545,
            wstimeout: 2000,
            provider: undefined,
            contracts: undefined,
            addresses: undefined
        };
        this.api = null;
        this.web3 = null;
        this.isReconnecting = false;
        this.lastBlock = 0;
    }

    _getBlockNumber() {
        const provider = this.web3.currentProvider;

        return new Promise((resolve, reject) => {
            
            // Start timeout
            const timeout = setTimeout(() => {

                if (provider.connection) {

                    provider.connection.close();
                }
                
                reject(new Error(`Websocket connection timeout (${this.config.wstimeout}ms) exceeded`));
            }, this.config.wstimeout);
            
            this.web3.eth.getBlockNumber()
                .then(blockNumber => {
                    this.lastBlock = blockNumber;
                    clearTimeout(timeout);
                    this.emit('lastBlockNumber', this.lastBlock);
                    resolve(this.lastBlock);
                })
                .catch(reject);
        });
    }

    // Handle native disconnects and errors on WebSocket provider
    _setProviderEvents() {
        const provider = this.web3.currentProvider;

        if (this.config.protocol === 'ws' || this.config.protocol === 'wss') {

            // Handle WebSocket events
            provider.on('error', err => this.emit('error', err));
            provider.on('end', () => this.reconnect().catch(err => this.emit('error', err)));
        }
    }

    /**
     * Reconnect Websocket connection
     *
     * @memberof PjsConnector
     */
    async reconnect(cb = () => {}) {
        const web3 = this.web3;
        const provider = web3.currentProvider;
        const url = provider.connection.url;

        if (!this.isReconnecting && this.state.get('pjs') !== PJS_STOPPED) {

            await (() => new Promise(async (resolve, reject) => {

                try {

                    const reconnectionTimeout = setTimeout(() => {
                        this.emit('error', new Error(`Websocket reconnection timeout (${this.config.wstimeout}ms) exceeded`));
                        this.isReconnecting = false;
                        this.reconnect(cb).then(cb).catch(err => {
                            this.emit('error', err);
                            reject(err);
                        });
                    }, this.config.wstimeout);
        
                    await this.state.set({
                        pjs: PJS_CONNECTING
                    });
        
                    this.isReconnecting = true;
                    this.emit('reconnectStarted', Date.now());
                    const newProvider = new Pjs.Web3.providers.WebsocketProvider(url);
    
                    newProvider.on('connect', async () => {
                    
                        try {
                            clearTimeout(reconnectionTimeout);
        
                            web3.setProvider(newProvider);
                            this._setProviderEvents();                            
        
                            await this.state.set({
                                pjs: PJS_CONNECTED
                            });
        
                            this.isReconnecting = false;
                            this.emit('reconnected', this.lastBlock);
                            resolve();
                        } catch (err) {
        
                            this.isReconnecting = false;
                            this.emit('error', err);
                            reject(err);
                        }
                    });
                } catch (err) {
                    reject(err);
                }
            }))();
        }
    }

    // Watching for WebSocket connection and continuosly fetching of last block
    // Last block will be used for reconnection of contrancs event handlers
    _watchWebsocket() {
        this._setProviderEvents();
        
        // Handle timeouts
        setInterval(() => {
            
            if (this.state.get('pjs') === PJS_CONNECTED) {

                this._getBlockNumber()
                    .catch(err => {
                        this.reconnect().catch(err => this.emit('error', err));
                    });
            }            
        }, this.config.wstimeout * 1.1);
    }

    /**
     * Start connection
     *
     * @param {Object} options
     * @memberof PjsConnector
     */
    async connect(options = {}) {

        if (options.state && options.state instanceof StateManager) {

            this.state = options.state;
        } else {

            throw new Error('StateManager is required as option for the PjsConnector');
        }

        if (options.config) {

            // Overrides related to testing
            if (process.env.NODE_ENV === 'testing' && 
                process.env.TESTING_ADDRESS_PANDORA && 
                process.env.TESTING_ADDRESS_PANDORA_MARKET) {

                options.config.addresses = {
                    Pandora: process.env.TESTING_ADDRESS_PANDORA,
                    PandoraMarket: process.env.TESTING_ADDRESS_PANDORA_MARKET
                };
            }

            this.config = {
                ...this.config,
                ...options.config
            };
        }

        // provider option can be provided by external environment 
        // (during tests, for example)
        if (!this.config.provider) {

            let url = `${this.config.protocol}://${this.config.host}${this.config.port ? ':' + this.config.port : ''}`;

            if (process.env.NODE_ENV === 'testing' && process.env.TESTING_PROVIDER_URL) {

                url = process.env.TESTING_PROVIDER_URL;
            }
            
            switch (this.config.protocol) {
                case 'ws':
                case 'wss':
                    this.config.provider = new Pjs.Web3.providers.WebsocketProvider(url);
                    break;
                
                case 'http':
                case 'https':
                    this.config.provider = new Pjs.Web3.providers.HttpProvider(url);
                    break;

                default:
                    throw new Error(`Unsupported protocol "${this.config.protocol}"`);
            }            
        }

        await this.state.set({
            pjs: PJS_CONNECTING
        });
    
        this.api = new Pjs({
            eth: {
                provider: this.config.provider
            },
            contracts: this.config.contracts,
            addresses: this.config.addresses
        });
        this.web3 = this.api.api.web3;

        if (this.config.protocol === 'ws' || this.config.protocol === 'wss') {

            const provider = this.web3.currentProvider;

            if (provider.connection.readyState !== provider.connection.OPEN) {

                await (() => new Promise((resolve, reject) => {
                    
                    const connectionTimeout = setTimeout(() => {
                        this.emit('error', new Error(`Websocket connection timeout (${this.config.wstimeout}ms) exceeded`));            
                        this.isReconnecting = false;
                        this.reconnect(resolve).then(resolve).catch(err => this.emit('error', err));
                    }, this.config.wstimeout);
                    
                    provider.on('connect', () => {
                        clearTimeout(connectionTimeout);                        
                        resolve();
                    });
                }))();
            }            
        }
        
        // Get last block number
        await this._getBlockNumber();
        
        await this.state.set({
            pjs: PJS_CONNECTED
        });

        if (this.config.protocol === 'ws' || this.config.protocol === 'wss') {

            this._watchWebsocket();
        }
    }
}

module.exports = new PjsConnector();
module.exports.PjsConnector = PjsConnector;
module.exports.PJS_STOPPED = PJS_STOPPED;
module.exports.PJS_CONNECTING = PJS_CONNECTING;
module.exports.PJS_CONNECTED = PJS_CONNECTED;

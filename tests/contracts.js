'use strict';

const path = require('path');
const GanacheNode = require('ganache-sandbox');
const copy = ['node_modules/openzeppelin-solidity'];
const extract = ['Pan', 'Pandora', 'PandoraMarket', 'EconomicController'];

module.exports = async () => {

    const node = new GanacheNode({
        path: path.join(__dirname, '../'),
        gas: 76000000,
        gasPrice: 0x01,
        copy,
        extract,
        timeout: 40000,
        debug: true,
        maxServers: 5
    });
    
    const [ server, provider, contracts, addresses, accounts, publisher ] = await Promise.all([
        node.server,
        node.provider,
        node.contracts,
        node.addresses,
        node.accounts,
        node.publisher
    ]);
    
    return {
        node,
        server,
        provider,
        contracts,
        addresses,
        accounts,
        publisher
    };
};

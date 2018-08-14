'use strict';

const path = require('path');
const GanacheNode = require('ganache-sandbox');
const copy = ['node_modules/openzeppelin-solidity'];
const extract = ['Pandora', 'PandoraMarket'];

module.exports = async () => {

    const node = new GanacheNode({
        path: path.join(__dirname, '../'),
        gas: 0xfffffffffff,
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

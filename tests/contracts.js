'use strict';

const path = require('path');
const GanacheNode = require('ganache-sandbox');
const extract = ['Pandora', 'PandoraMarket'];

module.exports = async () => {

    const node = new GanacheNode({ path: path.join(__dirname, '../'), extract });
    const server = await node.server;
    const provider = await node.provider;
    const contracts = await node.contracts;
    const addresses = await node.addresses;
    const publisher = await node.publisher;

    return {
        node,
        server,
        provider,
        contracts,
        addresses,
        publisher
    };
};

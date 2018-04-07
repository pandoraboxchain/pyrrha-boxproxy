'use strict';

const hosts = {
    default: {
        protocol: 'http',
        host: 'localhost',
        port: 8545,
        contracts: {
            Pandora: '',
            PandoraMarket: ''
        }
    },
    rsk: {
        protocol: 'http',
        host: 'bitcoin.pandora.network',
        port: 4444,
        contracts: {
            Pandora: '0xfeb13c11b476601dcba42e6eb502aa6047fe4b78',
            PandoraMarket: ''
        }
    },
    ropsten: {
        protocol: 'https',
        host: 'ropsten.infura.io/Llc2pOEtpgzvopBH8dst',
        port: '',
        contracts: {
            Pandora: '0xb1746daa5260ba5d94c6b407b226b1cb190190ab',
            PandoraMarket: '0xb452c5abf6a0ddc5f6afe8598e1e3e6ebeaf558c'
        }
    },
    rinkeby: {
        protocol: 'http',
        host: 'rinkeby.pandora.network',
        port: 8545,
        contracts: {
            Pandora: '0x9f301cfd1217fd60e4244a12b1edffe458e8b9bd',
            PandoraMarket: '0xaff19fee75b1443b41f0acbf54c83e2dab57eb82'
        }        
    }
};

let defaultHost = process.env.USE_HOST || 'rinkeby';

console.log('Used host:', hosts[defaultHost].host);

module.exports = {
    port: 1111,
    wsport: 1337,
    protocol: process.env.WEB3_PROTOCOL || hosts[defaultHost].protocol,
    nodePort: process.env.WEB3_PORT || hosts[defaultHost].port,
    nodeHost: process.env.WEB3_HOSTNAME || hosts[defaultHost].host,
    pandoraAddress: process.env.PAN_ADDRESS || hosts[defaultHost].contracts.Pandora,
    marketAddress: process.env.MARKET_ADDRESS || hosts[defaultHost].contracts.PandoraMarket
};

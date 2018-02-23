'use strict';

const hosts = {
    default: {
        protocol: 'http',
        host: 'localhost',
        port: 8545,
        contracts: {
            pandora: ''
        }
    },
    rsk: {
        protocol: 'http',
        host: 'bitcoin.pandora.network',
        port: 4444,
        contracts: {
            pandora: '0xfeb13c11b476601dcba42e6eb502aa6047fe4b78'
        }
    },
    infura: {
        protocol: 'https',
        host: 'ropsten.infura.io/Llc2pOEtpgzvopBH8dst',
        port: '',
        contracts: {
            pandora: '0xb1746daa5260ba5d94c6b407b226b1cb190190ab'
        }
    },
    rinkeby: {
        protocol: 'http',
        host: 'dockstation.pandora.network',
        port: 8545,
        contracts: {
            pandora: '0x58e66b79928cfb362b53c185a6a1fded882bb07d'
        }
        
    }
};

let defaultHost = process.env.USE_HOST || 'default';

console.log('Used host:', hosts[defaultHost].host);

module.exports = {
    port: 1111,
    wsport: 1337,
    protocol: process.env.WEB3_PROTOCOL || hosts[defaultHost].protocol,
    nodePort: process.env.WEB3_PORT || hosts[defaultHost].port,
    nodeHost: process.env.WEB3_HOSTNAME || hosts[defaultHost].host,
    pandoraAddress: process.env.PAN_ADDRESS || hosts[defaultHost].contracts.pandora
};

// for local development please use actual PAN contranc hash
// Pandora: 0xb1746daa5260ba5d94c6b407b226b1cb190190ab
// Market: 0xb452c5abf6a0ddc5f6afe8598e1e3e6ebeaf558c

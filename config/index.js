module.exports = {
    port: 1111,
    wsport: 1337,
    protocol: process.env.WEB3_PROTOCOL || 'https',
    nodePort: process.env.WEB3_PORT || '',
    nodeHost: process.env.WEB3_HOSTNAME || 'ropsten.infura.io/Llc2pOEtpgzvopBH8dst',
    pandoraAddress: process.env.PAN_ADDRESS ? process.env.PAN_ADDRESS : "0xb1746daa5260ba5d94c6b407b226b1cb190190ab"
};

// for local development please use actual PAN contranc hash
// Pandora: 0xb1746daa5260ba5d94c6b407b226b1cb190190ab
// Market: 0xb452c5abf6a0ddc5f6afe8598e1e3e6ebeaf558c

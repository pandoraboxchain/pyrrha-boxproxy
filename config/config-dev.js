module.exports = {
    port: 1111,
    wsport: 1337,
    node_url: `http://${process.env && process.env.WEB3_HOSTNAME ? process.env.WEB3_HOSTNAME : 'localhost'}:7545`,
    pandoraContractAddress: process.env && process.env.PAN_ADDRESS ? process.env.PAN_ADDRESS : "0x2c2b9c9a4a25e24b174f26114e8926a9f2128fe4"
};

// for local development please use actual PAN contranc hash

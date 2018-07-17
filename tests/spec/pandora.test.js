'use strict';
const { expect } = require('chai');
const ContractsNode = require('../contracts')();
const Pjs = require('pyrrha-js');
const pandora = require('../../src/pandora');

describe('Pandora module tests', () => {
    let config = {
        port: 1111,
        wsport: 1337,
        wstimeout: 3000
    };
    let server;

    let pjs;
    let publisher;
    
    const kernelIpfsHash = 'QmVDqZiZspRJLb5d5UjBmGfVsXwxWB3Pga2n33eWovtjV7';
    const kernelOptions = {
        dimension: 100, 
        complexity: 100, 
        price: 100,
        metadata: 'test',
        description: 'test'
    };
    let kernelContractAddress1;
    let kernelContractAddress2;
    let kernelContractAddress3;

    const datasetIpfsHash = 'QmVDqZiZspRJLb5d5UjBmGfVsXwxWB3Pga2n33eWovtjV7';
    const datasetBatchesCount = 10;
    const datasetOptions = {
        dimension: 100, 
        price: 100,
        metadata: 'test',
        description: 'test'
    };
    let datasetContractAddress1;
    let datasetContractAddress2;

    before(async () => {
        const node = await ContractsNode;

        server = node.node;
        config.provider = node.provider;
        config.contracts = node.contracts;
        config.addresses = node.addresses;
        publisher = node.publisher;

        process.env.TESTING_PROVIDER_URL = node.provider.connection.url;
        process.env.TESTING_ADDRESS_PANDORA = node.addresses.Pandora;
        process.env.TESTING_ADDRESS_PANDORA_MARKET = node.addresses.PandoraMarket;

        pjs = new Pjs({
            eth: {
                provider: node.provider
            },
            contracts: node.contracts,
            addresses: node.addresses
        });

        kernelContractAddress1 = await pjs.kernels.deploy(kernelIpfsHash, kernelOptions, publisher);
        await pjs.kernels.addToMarket(kernelContractAddress1, publisher);

        kernelContractAddress2 = await pjs.kernels.deploy(kernelIpfsHash, kernelOptions, publisher);
        await pjs.kernels.addToMarket(kernelContractAddress2, publisher);

        kernelContractAddress3 = await pjs.kernels.deploy(kernelIpfsHash, kernelOptions, publisher);
        await pjs.kernels.addToMarket(kernelContractAddress3, publisher);

        datasetContractAddress1 = await pjs.datasets.deploy(datasetIpfsHash, datasetBatchesCount, datasetOptions, publisher);
        await pjs.datasets.addToMarket(datasetContractAddress1, publisher);

        datasetContractAddress2 = await pjs.datasets.deploy(datasetIpfsHash, datasetBatchesCount, datasetOptions, publisher);
        await pjs.datasets.addToMarket(datasetContractAddress2, publisher);

        pandora.start(config);
    });

    after(done => pandora.stop(() => server.close(done)));

    it('Pandora should emit lastBlock number every 3 sec', done => {
        const timeout = setTimeout(() => done(new Error('last block not been obtained during timeout')), config.wstimeout * 1.2);
        
        pandora.once('blockNumber', data => {
            expect(data.blockNumber).to.be.a('number');
            clearTimeout(timeout);
            done();
        });
    });

    it('Pandora should emit an error if unknown command obtained from worker', done => {
        const timeout = setTimeout(() => done(new Error('error not emitted during timeout')), 1000);
        
        pandora.once('error', err => {
            expect(err.message).to.be.equal('Unknown worker command');
            clearTimeout(timeout);
            done();
        });

        pandora._messageManager({
            cmd: 'UnKnOwN'
        });
    });

    it('Pandora should emit kernelsRecords baseline on request', done => {
        const timeout = setTimeout(() => done(new Error('kernelsRecords not been obtained during timeout')), 3000);

        pandora.once('error', done);
        pandora.once('kernelsRecords', data => {
            expect(Array.isArray(data.records)).to.be.true;
            expect(data.records.length).to.be.equal(3);
            expect(data.baseline).to.be.true;
            expect(data.blockNumber).to.be.a('number');
            clearTimeout(timeout);
            done();
        });

        pandora.emit('getKernels');
    });

    it('Pandora should emit kernelsRecords if new kernel has been added during subscription', done => {
        const timeout = setTimeout(() => done(new Error('kernelsRecords (new kernel) not been obtained during timeout')), 3000);

        pandora.once('error', done);
        pandora.once('kernelsRecords', data => {
            expect(Array.isArray(data.records)).to.be.true;
            expect(data.blockNumber).to.be.a('number');
            clearTimeout(timeout);
            done();
        });

        pandora.emit('subscribeKernels');

        (async () => {
            const kernelContractAddress4 = await pjs.kernels.deploy(kernelIpfsHash, kernelOptions, publisher);
            await pjs.kernels.addToMarket(kernelContractAddress4, publisher);
        })().catch(done);
    });

    it('Pandora should emit kernelsRecordsRemove if new kernel has been removed from PandoraMarket during subscription', done => {
        const timeout = setTimeout(() => done(new Error('kernelsRecordsRemove (removed kernel) not been obtained during timeout')), 3000);

        pandora.once('error', done);
        pandora.once('kernelsRecordsRemove', data => {
            expect(Array.isArray(data.records)).to.be.true;
            expect(data.records.length).to.be.equal(1);
            expect(data.records[0].address).to.be.equal(kernelContractAddress1);
            expect(data.blockNumber).to.be.a('number');
            clearTimeout(timeout);
            done();
        });

        pandora.emit('subscribeKernels');

        (async () => {
            await pjs.kernels.removeKernel(kernelContractAddress1, publisher);
        })().catch(done);
    });

    it('Pandora should emit datasetsRecords baseline on request', done => {
        const timeout = setTimeout(() => done(new Error('datasetsRecords not been obtained during timeout')), 3000);

        pandora.once('error', done);
        pandora.once('datasetsRecords', data => {
            expect(Array.isArray(data.records)).to.be.true;
            expect(data.records.length).to.be.equal(2);
            expect(data.baseline).to.be.true;
            expect(data.blockNumber).to.be.a('number');
            clearTimeout(timeout);
            done();
        });

        pandora.emit('getDatasets');
    });

    it('Pandora should emit datasetsRecords if new dataset has been added during subscription', done => {
        const timeout = setTimeout(() => done(new Error('datasetsRecords (new dataset) not been obtained during timeout')), 3000);

        pandora.once('error', done);
        pandora.once('datasetsRecords', data => {
            expect(Array.isArray(data.records)).to.be.true;
            expect(data.blockNumber).to.be.a('number');
            clearTimeout(timeout);
            done();
        });

        pandora.emit('subscribeDatasets');

        (async () => {
            const datasetContractAddress3 = await pjs.datasets.deploy(datasetIpfsHash, datasetBatchesCount, datasetOptions, publisher);
            await pjs.datasets.addToMarket(datasetContractAddress3, publisher);
        })().catch(done);
    });

    it('Pandora should emit datasetsRecordsRemove if new kernel has been removed from PandoraMarket during subscription', done => {
        const timeout = setTimeout(() => done(new Error('datasetsRecordsRemove (removed dataset) not been obtained during timeout')), 3000);

        pandora.once('error', done);
        pandora.once('datasetsRecordsRemove', data => {
            expect(Array.isArray(data.records)).to.be.true;
            expect(data.records.length).to.be.equal(1);
            expect(data.records[0].address).to.be.equal(datasetContractAddress1);
            expect(data.blockNumber).to.be.a('number');
            clearTimeout(timeout);
            done();
        });

        pandora.emit('subscribeDatasets');

        (async () => {
            await pjs.datasets.removeDataset(datasetContractAddress1, publisher);
        })().catch(done);
    });

});

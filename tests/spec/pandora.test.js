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
    let accounts;
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
    const datasetBatchesCount = 1;
    const datasetOptions = {
        dimension: 100, 
        price: 100,
        metadata: 'test',
        description: 'test'
    };
    let datasetContractAddress1;
    let datasetContractAddress2;

    let workerNodeAddress1;

    before(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const node = await ContractsNode;

        server = node.node;
        config.provider = node.provider;
        config.contracts = node.contracts;
        config.addresses = node.addresses;

        accounts = node.accounts;
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

        await pjs.pandora.whitelistWorkerOwner(publisher, accounts[2]);
        workerNodeAddress1 = await pjs.pandora.createWorkerNode(accounts[2]);
        await pjs.workers.alive(workerNodeAddress1, accounts[2]);

        pandora.start(config);
    });

    after(done => pandora.stop(() => server.close(done)));

    it('Pandora should emit lastBlockNumber number every 3 sec', done => {

        const timeout = setTimeout(() => done(new Error('lastBlockNumber not been obtained during timeout')), config.wstimeout * 1.2);
        
        pandora.once('lastBlockNumber', data => {
            expect(data.blockNumber).to.be.a('number');
            clearTimeout(timeout);
            done();
        });
    });

    it('Pandora should emit an error if unknown command obtained from worker', async () => {
        
        await new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('error not been obtained during timeout')), config.wstimeout * 1.2);

            pandora.once('error', err => {
                clearTimeout(timeout);
                expect(err.message).to.be.equal('Unknown worker command');
                resolve();
            });

            pandora._messageManager({
                cmd: 'UnKnOwN'
            });        
        });        
    });

    it('Pandora should emit kernelsRecords baseline on request', async () => {
        
        await new Promise((resolve, reject) => {

            pandora.once('error', reject);
            pandora.once('kernelsRecords', data => {
                expect(Array.isArray(data.records)).to.be.true;
                expect(data.records.length).to.be.equal(3);
                expect(data.baseline).to.be.true;
                expect(data.blockNumber).to.be.a('number');
                resolve();
            });            

            pandora.emit('getKernels');
        });
    });

    it('Pandora should emit kernelsRecords if new kernel has been added during subscription', async () => {
        
        pandora.emit('subscribeKernels');

        await new Promise(async (resolve, reject) => {

            pandora.once('error', reject);
            pandora.once('kernelsRecords', data => {
                expect(Array.isArray(data.records)).to.be.true;
                expect(data.blockNumber).to.be.a('number');
                resolve();
            });

            const kernelContractAddress4 = await pjs.kernels.deploy(kernelIpfsHash, kernelOptions, publisher);
            await pjs.kernels.addToMarket(kernelContractAddress4, publisher);
        });
    });

    it('Pandora should emit kernelsRecordsRemove if new kernel has been removed from PandoraMarket during subscription', async () => {
        
        pandora.emit('subscribeKernels');

        await new Promise(async (resolve, reject) => {

            pandora.once('error', reject);
            pandora.once('kernelsRecordsRemove', data => {
                expect(Array.isArray(data.records)).to.be.true;
                expect(data.records.length).to.be.equal(1);
                expect(data.records[0].address).to.be.equal(kernelContractAddress1);
                expect(data.blockNumber).to.be.a('number');
                resolve();
            });

            await pjs.kernels.removeKernel(kernelContractAddress1, publisher);
        });
    });

    it('Pandora should emit datasetsRecords baseline on request', async () => {
        
        await new Promise((resolve, reject) => {

            pandora.once('error', reject);
            pandora.once('datasetsRecords', data => {
                expect(Array.isArray(data.records)).to.be.true;
                expect(data.records.length).to.be.equal(2);
                expect(data.baseline).to.be.true;
                expect(data.blockNumber).to.be.a('number');
                resolve();
            });

            pandora.emit('getDatasets');
        });        
    });

    it('Pandora should emit datasetsRecords if new dataset has been added during subscription', async () => {
        pandora.emit('subscribeDatasets');

        await new Promise(async (resolve, reject) => {

            pandora.once('error', reject);
            pandora.once('datasetsRecords', data => {
                expect(Array.isArray(data.records)).to.be.true;
                expect(data.blockNumber).to.be.a('number');                
                resolve();
            });

            const datasetContractAddress3 = await pjs.datasets.deploy(datasetIpfsHash, datasetBatchesCount, datasetOptions, publisher);
            await pjs.datasets.addToMarket(datasetContractAddress3, publisher);
        });
    });

    it('Pandora should emit datasetsRecordsRemove if new kernel has been removed from PandoraMarket during subscription', async () => {
        pandora.emit('subscribeDatasets');

        await new Promise(async (resolve, reject) => {

            pandora.once('error', reject);
            pandora.once('datasetsRecordsRemove', data => {
                expect(Array.isArray(data.records)).to.be.true;
                expect(data.records.length).to.be.equal(1);
                expect(data.records[0].address).to.be.equal(datasetContractAddress1);
                expect(data.blockNumber).to.be.a('number');                
                resolve();
            });

            await pjs.datasets.removeDataset(datasetContractAddress1, publisher);
        });
    });

    it('Pandora should emit jobsRecords if new job created', async () => {
        let jobId;

        pandora.emit('subscribeJobs');

        await new Promise(async (resolve, reject) => {

            pandora.once('error', reject)
            pandora.once('jobsRecords', data => {
                expect(Array.isArray(data.records)).to.be.true;
                expect(data.records[0].address).to.be.equal(jobId);
                expect(data.blockNumber).to.be.a('number');
                expect(data.baseline).to.be.false;
                resolve();
            });
            pandora.once('subscriptionsList', console.log);
            pandora.emit('getSubscriptionsList');
    
            setTimeout(async () => {

                jobId = await pjs.jobs.create({
                    kernel: kernelContractAddress2, 
                    dataset: datasetContractAddress2,
                    complexity: 1,
                    jobType: '0', 
                    description: 'test job',
                    deposit: 1
                }, publisher);
            }, 1000);
        });        
    });
});

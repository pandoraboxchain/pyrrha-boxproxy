const express = require('express');
const bodyParser = require('body-parser');
const Web3 = require('web3');
const app = express();

const eth_node_url = 'http://localhost:8545';
const web3 = new Web3(new Web3.providers.HttpProvider(eth_node_url));

import PandoraABI from '../pandora-abi/Pandora.json';

// NOTE: USE ONLY DOUBLE QUOTES FOR CONTRACT ADDRESS
const contractAddr = "0x485baa11b6d1d1fbefae21de96064060415a1bf9";
const finABI = PandoraABI.abi;
const PANContract = web3.eth.contract(finABI).at(contractAddr);
const port = 1111;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('json spaces', 40);

app.listen(port, () => {
    console.log('Server running at http://127.0.0.1:'+port+'');
});

app.get('/', (req, res) => {
    res.send('Empty GET!')
});

app.get('/abi', (req, res) => {
    return res.json(finABI);
});

app.get('/workers', (req, res) => {
    let workerNodesCount = PANContract.workerNodesCount();
    let workersList = {};
    for (let _count=0; _count < workerNodesCount; _count++) {
        let singleWorker = {
            'address':(PANContract.workerNodes(_count)),
            'status':'status'
        };
        workersList[_count]=singleWorker;
    }
    let workers = {
        'workersList': workersList,
        'workersTotal': workerNodesCount
    };
    return res.json(workers);
});

app.get('/workers/:id', (req, res) => {
    let workerNodesCount = PANContract.workerNodesCount();
    if (req.params.id >= workerNodesCount) {
        res.send('Invalid worker ID!');
    } else {
        let worker = {
            'address': PANContract.workerNodes(req.params.id)
        };
        return res.json(worker);
    }
});

app.get('/jobs', (req, res) => {
    let activeJobs = {
        'activeJobs': PANContract.activeJobs("0xb1e4f3293210ac656d7b0f68420e245f4798f9c5")
    };
    return res.json(activeJobs);
});

app.get('/kernels', (req, res) => {

});

function workersListing() {
    web3.eth.getBalance(addr).then(console.log);
}
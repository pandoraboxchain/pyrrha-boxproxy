const express = require('express');
const bodyParser = require('body-parser');
const Web3 = require('web3');
const app = express();

const eth_node_url = 'http://localhost:8545';
const web3 = new Web3(new Web3.providers.HttpProvider(eth_node_url));

const port = 2222;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.listen(port, () => {

    console.log('Server running at http://127.0.0.1:'+port+'/');

    web3.eth.getBalance("0x009ba8c4fb31386d812b90f2c4C1b14AF244698a").then(console.log);

});
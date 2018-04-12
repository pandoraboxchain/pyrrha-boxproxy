'use strict';

const { expect } = require('chai');
const boxproxy = require('../../src/server');
const ContractsNode = require('../contracts')();

describe('Boxproxy tests:', () => {

    let config = {
        port: 1111,
        wsport: 1337
    };
    let server;
    let store;
    

    before(() => ContractsNode
        .then(node => {
            server = node.node;
            config.provider = node.provider;
            config.contracts = node.contracts;
            config.addresses = node.addresses;
            return node;
        })
        .then(node => {
            store = boxproxy(config);
        }));

    after(done => {
        store.get('ws').close(() => 
            store.get('express').close(() => {
                setTimeout(() => server.close(done), 50);
            }));       
    });

    it('#store should should have a property "app"', () => {
        expect(store.get('app')).to.be.a('function');
    });

    it('#store should should have a property "express"', () => {
        const express = store.get('express');
        expect(express).to.be.a('object');
        expect(express.close).to.be.a('function');
    });

    it('#store should should have a property "web3"', () => {
        const web3 = store.get('web3');
        expect(web3).to.be.a('object');
        expect(web3).to.have.property('version');
    });

    it('#store should should have a property "ws"', () => {
        const ws = store.get('ws');
        expect(ws).to.be.a('object');
        expect(ws.push).to.be.a('function');
        expect(ws.close).to.be.a('function');
    });

    it('#store should should have a property "pjs"', () => {
        const pjs = store.get('pjs');
        expect(pjs).to.be.a('object');
        expect(pjs).to.have.property('version');
    });
});

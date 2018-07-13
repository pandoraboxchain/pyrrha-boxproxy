'use strict';

const { expect } = require('chai');
const { stringifyCircular, safeObject } = require('../../src/utils/json');

describe('JSON utils tests', () => {
    const TEST_ERROR = 'TEST_ERROR';

    it('#stringifyCircular should stringify objects with circular references without exceptions', () => {
        const obj = {};
        obj.test = 'test';
        obj.o = obj;
        const test = stringifyCircular(obj);
        const reObj = JSON.parse(test);
        expect(test).to.be.a('string');
        expect(reObj).to.be.an('object');
    });

    it('#safeObject should correctly convert Error object', () => {
        const err = new Error(TEST_ERROR);
        err.code = TEST_ERROR;
        const safeObj = safeObject(err);
        expect(safeObj).to.be.an('object');
        expect(safeObj.message).to.be.equal(TEST_ERROR);
        expect(safeObj.code).to.be.equal(TEST_ERROR);
    });
});

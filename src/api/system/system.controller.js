'use strict';
const pack = require('../../../package.json');
const config = require('../../../config');
const expect = require('../../utils/expect');
const logger = require('../../logger');
const { normalizePageLimit } = require('../../utils/pagination');
const { 
    getAll,
    clearBaseline
 } = require('../../db/api/system');
 const pandora = require('../../pandora');

// @route /system/version
module.exports.getVersion = (req, res, next) => {

    res.status(200).json({ version: pack.version });
};

// @route /system/addresses
module.exports.getAddresses = (req, res, next) => {

    res.status(200).json(config.addresses);
};

// @route /system/runtime
module.exports.getRuntimeProperties = async (req, res, next) => {

    try {

        const { rows, count } = await getAll(req.query);
        const { limit, page } = normalizePageLimit(req.query.page, req.query.limit, count);
        
        res.status(200).json({
            records: rows,
            count,
            limit,
            page
        });
    } catch(err) {
        next(err);
    }
};

// @route /system/subscriptions
module.exports.getSubscriptionsList = (req, res, next) => {
    let timeout;
    
    const onResponseReceived = message => {

        clearTimeout(timeout);
        res.status(200).json(message);        
    };

    timeout = setTimeout(() => {
        pandora.removeListener('subscriptionsList', onResponseReceived);
        next(Error('Subscriptions list not received. Timeout exceeded'));
    }, 1000);

    pandora.once('subscriptionsList', onResponseReceived);
    pandora.emit('getSubscriptionsList');
};

// @router /system/state
module.exports.getState = (req, res, next) => {
    let timeout;
    
    const onResponseReceived = message => {

        clearTimeout(timeout);
        res.status(200).json({
            state: message.state,
            date: message.date
        });        
    };

    timeout = setTimeout(() => {
        pandora.removeListener('state', onResponseReceived);
        next(Error('State not received. Timeout exceeded'));
    }, 1000);

    pandora.once('state', onResponseReceived);
    pandora.emit('getState');
};

// @route /system/reset/baseline/<optional_property>
module.exports.resetBaseline = async (req, res, next) => {

    let baselineConfig = {
        kernels: {
            property: 'kernelsBaseline',
            event: 'getKernels'
        },
        datasets: {
            property: 'datasetsBaseline',
            event: 'getDatasets'
        },
        workers: {
            property: 'workersBaseline',
            event: 'getWorkers'
        },
        jobs: {
            property: 'jobsBaseline',
            event: 'getJobs'
        }
    };

    let baselineKeys;

    try {

        baselineKeys = Object.keys(baselineConfig);

        if (req.params.id) {

            baselineKeys = baselineKeys.filter(key => key === req.params.id);
        }
        
        if (baselineKeys.length > 0) {

            await Promise.all(baselineKeys.map(key => clearBaseline(baselineConfig[key].property)));
            baselineKeys.map(key => pandora.emit(baselineConfig[key].event));
        }

        res.status(200).json({
            success: 'success',
            date: Date.now()
        });
    } catch (err) {
        next(err);
    }
};

// @route /system/loglevel
module.exports.getLogLevel = (req, res, next) => {

    try {

        // const levels = logger.transports.map(transport => ({
        //     name: transport.name,
        //     level: transport.level
        // }));
        res.status(200).json({
            level: logger.level,
            date: Date.now()
        });
    } catch (err) {
        return next(err);
    }
};

// @route /system/loglevel/<level_key>
module.exports.setLogLevel = (req, res, next) => {

    try {

        expect.all(req.params, {
            'level': {
                type: 'enum',
                values: [
                    'error',
                    'warn',
                    'info',
                    'verbose',
                    'debug',
                    'silly'
                ]
            }
        });

        logger.level = req.params.level;
        res.status(200).json({
            success: 'success',
            date: Date.now()
        });
    } catch (err) {
        return next(err);
    }
};

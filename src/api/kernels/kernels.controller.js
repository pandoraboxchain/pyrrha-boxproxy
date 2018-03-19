'use strict';
const store = require('../../store');
const { kernels: { fetchAll, fetchKernel } } = store.get('pjs');

// @route /kernels
module.exports.getKernels = async (req, res, next) => {

    try {

        const { records, error } = await fetchAll();
        
        res.status(200).json({
            kernels: records,
            error,
            kernelsTotal: records.length
        });
    } catch(err) {
        next(err);
    }
};

// @route /kernels/:address
module.exports.getKernelByAddress = async (req, res, next) => {

    try {

        const kernel = await fetchKernel(req.params.address);
        
        res.status(200).json(kernel);
    } catch(err) {
        next(err);
    }
};

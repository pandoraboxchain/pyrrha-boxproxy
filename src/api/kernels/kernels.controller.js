'use strict';
const store = require('../../store');
const { kernels: { fetchAll } } = store.get('pjs');

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
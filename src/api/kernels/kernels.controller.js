'use strict';
const {
    getKernels
} = require('../../libs/pandora.lib');

// @route /kernels
module.exports.getKernels = async (req, res, next) => {

    try {

        const kernels = await getKernels();
        
        res.status(200).json({
            kernels,
            kernelsTotal: kernels.length
        });
    } catch(err) {
        next(err);
    }
};
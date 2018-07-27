const system = require('./system.seed');
const datasets = require('./datasets.seed');
const kernels = require('./kernels.seed');
const jobs = require('./jobs.seed');
const workers = require('./workers.seed');

module.exports = [
    system,
    datasets,
    kernels,
    jobs,
    workers
];

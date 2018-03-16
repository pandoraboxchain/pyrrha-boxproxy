'use strict';
const store = require('../../store');
const { version } = store.get('pjs');

module.exports = push => {
    // method's logic...
    push({
        version
    });
};

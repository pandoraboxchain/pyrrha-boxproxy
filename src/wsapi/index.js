'use strict';

/** 

// API method template 
module.exports = push  => {
    // method's logic...
    push({
        some: data
    });
};

*/

module.exports = server => {
    // Input API
    // @todo Create input messages API handler
    // @todo Create mapping of RESTful API to ws 

    // Output API
    [
        require('./out/cognitiveJobCreated')
    ].map(api => api(server.push));
};

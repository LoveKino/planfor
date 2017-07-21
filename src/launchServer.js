'use strict';

let planServer = require('./server');
let {
    SERVER_PORT
} = require('./config');
let log = console.log; // eslint-disable-line

module.exports = async(planConfig = {}) => {
    log(`plan config is ${JSON.stringify(planConfig, null, 4)}`);
    let port = planConfig.port || SERVER_PORT;

    let {
        start
    } = planServer(planConfig);

    log(`plan server start at port ${port}`);

    return start(port);
};

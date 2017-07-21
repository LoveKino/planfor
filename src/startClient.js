'use strict';

let planClient = require('./client');
let {
    SERVER_PORT, SERVER_HOST
} = require('./config');
let log = console.log; // eslint-disable-line

module.exports = (planConfig = {}) => {
    let port = planConfig.port || SERVER_PORT;
    let hostname = planConfig.hostname || SERVER_HOST;

    return planClient({
        hostname, port
    });
};

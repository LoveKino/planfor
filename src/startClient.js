'use strict';

let planClient = require('./client');
let {
    SERVER_PORT, SERVER_HOST
} = require('./config');
let log = console.log; // eslint-disable-line

module.exports = (hostname, port) => {
    return planClient({
        hostname: hostname || SERVER_HOST,
        port: port || SERVER_PORT
    });
};

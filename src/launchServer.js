'use strict';

let planServer = require('./server');
let {
    SERVER_PORT
} = require('./config');
let log = console.log; // eslint-disable-line

module.exports = async(port) => {
    port = port || SERVER_PORT;

    let {
        start
    } = planServer();

    log(`plan server start at port ${port}`);

    return start(port);
};

'use strict';

let requestor = require('cl-requestor');
let request = requestor('http');

let log = console.log; // eslint-disable-line

module.exports = ({
    hostname, port
}) => {
    let loadPlan = async(planConfigPath) => {
        let {
            body
        } = await request({
            path: `/api/plan/load?planConfigPath=${planConfigPath}`,
            hostname,
            port
        });

        log(body);
    };

    return {
        loadPlan,
    };
};

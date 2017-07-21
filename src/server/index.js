'use strict';

let {
    weekPlan
} = require('../plansys');
let crudeServer = require('crude-server');
let log = console.log; //eslint-disable-line

module.exports = (planConfig) => {
    let {
        loadPlanData
    } = weekPlan(planConfig, {
        log
    });

    return crudeServer((pathname) => {
        log(pathname);
        if (pathname === '/api/plan/week/load') {
            return async(req, res) => {
                let planData = await reqBody(req);
                loadPlanData(planData);
                res.end('plan loaded');
            };
        }
    });
};

let reqBody = (req) => {
    return new Promise((resolve, reject) => {
        let chunks = [];
        req.on('data', (chunk) => {
            chunks.push(chunk);
        });

        req.on('end', () => {
            try {
                let data = JSON.parse(chunks.join(''));
                resolve(data);
            } catch (err) {
                reject(err);
            }
        });
    });
};

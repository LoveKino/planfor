'use strict';

let crudeServer = require('crude-server');
let url = require('url');
let plansys = require('./plansys');

let log = console.log; //eslint-disable-line

module.exports = () => {
    let {
        reloadPlan
    } = plansys({
        log
    });

    return crudeServer((pathname, reqUrl) => {
        log(reqUrl);

        // load plans
        if (pathname === '/api/plan/load') {
            return async(req, res) => {
                let planConfigPath = url.parse(req.url, true).query.planConfigPath;
                try {
                    await reloadPlan(planConfigPath);
                    res.end('plan reloaded!');
                } catch (err) {
                    res.end(`error happened when try to reload plan ${planConfigPath}. Error message: ${err.toString()}`);
                    log(err);
                }
            };
        }
    });
};

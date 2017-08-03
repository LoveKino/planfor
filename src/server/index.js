'use strict';

let crudeServer = require('crude-server');
let url = require('url');
let plansys = require('./plansys');
let fs = require('fs');
let path = require('path');

let log = console.log; //eslint-disable-line

let webDir = path.join(__dirname, '../web');
let webIndexPage = path.join(webDir, './index.html');

let responseFile = (filePath, res) => {
    return new Promise((resolve, reject) => {
        let stream = fs.createReadStream(filePath);
        stream.on('data', (chunk) => {
            res.write(chunk);
        });

        stream.on('end', () => {
            res.end();
            resolve();
        });

        stream.on('error', (err) => {
            reject(err);
        });
    });
};

module.exports = () => {
    let {
        reloadPlan,
        getFocusData,
        getDailyTasks
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
                    planConfigPath = planConfigPath.trim();
                    await reloadPlan(planConfigPath);
                    res.end('plan reloaded!');
                } catch (err) {
                    res.end(`error happened when try to reload plan ${planConfigPath}. Error message: ${err.toString()}`);
                    log(err);
                }
            };
        } else if (pathname === '/api/plan/focus') {
            return runTimeError(async(req, res) => {
                let planConfigPath = url.parse(req.url, true).query.planConfigPath;
                planConfigPath = planConfigPath.trim();
                let result = await getFocusData(planConfigPath);
                res.end(JSON.stringify({
                    errno: 0,
                    data: result
                }));
            });
        } else if (pathname === '/api/plan/daily') {
            return runTimeError(async(req, res) => {
                let planConfigPath = url.parse(req.url, true).query.planConfigPath;
                planConfigPath = planConfigPath.trim();
                let result = await getDailyTasks(planConfigPath);
                res.end(JSON.stringify({
                    errno: 0,
                    data: result
                }));
            });
        } else if (pathname === '/') {
            return runTimeError((req, res) => {
                return responseFile(webIndexPage, res);
            });
        } else if (pathname.startsWith('/assets/')) {
            let filePath = path.join(webDir, '.' + pathname);

            return runTimeError((req, res) => {
                // TODO 404
                // TODO http cache
                return responseFile(filePath, res);
            });
        }
    });
};

let runTimeError = (fn) => {
    return async(req, res) => {
        try {
            await fn(req, res);
        } catch (err) {
            res.end(JSON.stringify({
                errno: 1,
                errMsg: `Error happened. Error message: ${err.toString()}`
            }));
            log(err);
        }
    };
};

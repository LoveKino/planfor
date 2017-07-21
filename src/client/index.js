'use strict';

let requestor = require('cl-requestor');
let {
    parseStrToAst, checkASTWithContext, executeAST
} = require('text-flow-pfc-compiler');
let request = requestor('http');
let contextText = require('text-flow-pfc-compiler/apply/contextText');

let sandboxer = (item, index, tokens) => {
    return Object.assign(contextText(item, index, tokens), {
        // define a reminder job
        reminder: (time, content, who) => {
            return {
                type: 'reminder',
                content,
                who,
                time: new Date(time).getTime()
            };
        }
    });
};

module.exports = ({
    hostname, port
}) => {
    let postASTResults = async(planStr, postPath, sandboxer) => {
        let ast = parseStrToAst(planStr);

        checkASTWithContext(ast, sandboxer);

        let result = executeAST(ast, sandboxer);

        return request({
            path: postPath,
            hostname,
            port,
            method: 'POST'
        }, JSON.stringify(result));
    };

    let loadWeekPlan = (planStr) => {
        return postASTResults(planStr, '/api/plan/week/load', (item, index, tokens) => {
            return Object.assign(sandboxer(item, index, tokens), {});
        });
    };

    let loadIntervalPlan = (planStr) => {
        return postASTResults(planStr, '/api/plan/interval/load', () => {
            return {};
        });
    };

    return {
        loadWeekPlan,
        loadIntervalPlan
    };
};

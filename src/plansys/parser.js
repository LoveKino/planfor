'use strict';

let fs = require('fs');
let promisify = require('es6-promisify');
let {
    parseStrToAst,
    checkASTWithContext,
    executeAST
} = require('text-flow-pfc-compiler');
let sandboxer = require('./sandboxer');
let path = require('path');
let _ = require('lodash');

let readFile = promisify(fs.readFile);

// parse plan document
let parsePlanTree = async(indexPlanFile) => {
    let planItemsMap = {};

    let stack = [indexPlanFile];
    let closeMap = {
        [indexPlanFile]: true
    };

    while (stack.length) {
        let top = stack.pop(); // current parse plan file
        let planstr = await readFile(top, 'utf-8');
        let ast = parseStrToAst(planstr);

        let contexter = (item, index, tokens) => {
            return Object.assign(sandboxer(top)(item, index, tokens), {
                linkPlan: (filePath) => {
                    filePath = path.join(top, '..', filePath);
                    if (!closeMap[filePath]) {
                        stack.push(filePath);
                        closeMap[filePath] = true;
                    }

                    return {
                        type: 'linkPlan',
                        filePath
                    };
                },

                planFocus: (planPath) => {
                    planPath = path.join(top, '..', planPath);
                    return {
                        type: 'planFocus',
                        planPath
                    };
                }
            });
        };

        checkASTWithContext(ast, contexter);
        let fileItems = executeAST(ast, contexter);
        planItemsMap[top] = fileItems;
    }

    // resolve tasks
    let tasks = _.reduce(planItemsMap, (prev, fileItems) => {
        return prev.concat(_.filter(fileItems, (item) => item.type === 'pfc' && item.value.type === 'task').map(({
            value
        }) => value));
    }, []);

    // build map
    let planTaskMap = _.reduce(planItemsMap, (prev, fileItems, filePath) => {
        prev[filePath] = _.reduce(fileItems, (pre, item) => {
            if (item.type === 'pfc' && item.value.type === 'task') {
                // check repeated name
                if (pre[item.value.name]) {
                    throw new Error(`Repeated task names in a same plan file. Task info: ${filePath}, ${item.value.name}.`);
                }
                pre[item.value.name] = item;
            }

            return pre;
        }, {});

        return prev;
    }, {});

    let focusItem = planItemsMap[indexPlanFile].find((item) => {
        return item.type === 'pfc' && item.value.type === 'planFocus';
    });

    return {
        planItemsMap,
        planTaskMap,
        tasks,
        focus: focusItem && await parsePlanFocus(focusItem.value.planPath, planTaskMap)
    };
};

let parsePlanFocus = async(filePath, planTaskMap) => {
    let planstr = await readFile(filePath, 'utf-8');
    let ast = parseStrToAst(planstr);

    let contexter = () => {
        return {
            linkTask: (planFile, name) => {
                planFile = path.join(filePath, '..', planFile);
                if (!(planTaskMap[planFile] && planTaskMap[planFile][name])) {
                    throw new Error(`Try to link unexistence task. Link info: ${planFile}, ${name}`);
                }
                return {
                    type: 'linkTask',
                    planFile,
                    name
                };
            }
        };
    };

    checkASTWithContext(ast, contexter);

    let fileItems = executeAST(ast, contexter);

    return fileItems;
};

let recoveryPlanFile = (planItems, {
    startDelimiter = '{:',
    endDelimiter = ':}'
} = {}) => {
    return _.reduce(planItems, (prev, item) => {
        if (item.type === 'text') {
            prev += item.text;
        } else if (item.type === 'pfc') {
            prev += `${startDelimiter}${item.code}${endDelimiter}`;
        }

        return prev;
    }, '');
};

module.exports = {
    parsePlanTree,
    recoveryPlanFile
};

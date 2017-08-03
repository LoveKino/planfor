'use strict';

let fs = require('fs');
let path = require('path');
let promisify = require('es6-promisify');
let interval = require('./interval');
let sandboxer = require('./sandboxer');
let {
    parseStrToAst,
    checkASTWithContext,
    executeAST
} = require('text-flow-pfc-compiler');
let sendMail = require('./sendMail');
let _ = require('lodash');

let readFile = promisify(fs.readFile);

module.exports = ({
    log
}) => {
    let tasksMap = {};

    let reloadPlan = async(planConfigPath) => {
        if (!planConfigPath) {
            throw new Error('must specify plan config path');
        }
        let planConfigStr = await readFile(planConfigPath, 'utf-8');
        let planConfig = JSON.parse(planConfigStr);
        planConfig.plan = planConfig.plan || 'index.md';

        let planIndexFile = path.join(planConfigPath, '..', planConfig.plan);

        // parse plan files to tasks
        let {
            tasks,
            focus,
            planTaskMap,
        } = await parsePlanToTasks(planIndexFile);

        log(tasks);
        log(focus);

        tasksMap[planConfigPath] = {
            tasks,
            planConfig,
            focus,
            planTaskMap
        };
    };

    let getFocusData = async(planConfigPath) => {
        if (!planConfigPath) {
            throw new Error('must specify plan config path');
        }
        let plan = tasksMap[planConfigPath];
        if (!plan) {
            throw new Error(`no plan for ${planConfigPath}`);
        }

        let {
            focus,
            planTaskMap
        } = plan;

        return _.map(focus, (item) => {
            item = _.cloneDeep(item);
            if (item.type === 'pfc' && item.value.type === 'linkTask') {
                let {
                    planFile,
                    name
                } = item.value;
                let sourceTask = planTaskMap[planFile][name];
                item.value.sourceTask = sourceTask;
            }

            return item;
        });
    };

    let getDailyTasks = (planConfigPath) => {
        if (!planConfigPath) {
            throw new Error('must specify plan config path');
        }

        let plan = tasksMap[planConfigPath];

        if (!plan) {
            throw new Error(`no plan for ${planConfigPath}`);
        }

        let {
            tasks
        } = plan;

        return _.filter(tasks, ({
            moment: {
                event
            }
        }) => {
            return event.type === 'daily';
        });
    };

    interval(1000, (prevTime, curTime) => {
        for (let name in tasksMap) {
            let {
                tasks,
                planConfig
            } = tasksMap[name];
            for (let i = 0; i < tasks.length; i++) {
                let {
                    moment: {
                        event
                    },
                    progress,
                    target
                } = tasks[i];

                if (isTimeMoment(prevTime, curTime, event)) {
                    runTask(progress, target, planConfig, log);
                }
            }
        }
    });

    return {
        reloadPlan,
        getFocusData,
        getDailyTasks
    };
};

let runTask = ({
    content: {
        type,
        actionType,
        info
    }
}, target, planConfig, log) => {
    if (type === 'atom' && actionType === 'sendEmail') {
        return sendMail(info.title, info.content, planConfig['target'][target].mail, log);
    }
};

let isTimeMoment = (prevTime, curTime, event) => {
    let prevDate = new Date(prevTime);
    let curDate = new Date(curTime);

    if (event.type === 'daily') {
        let prevHours = prevDate.getHours();
        let curHours = curDate.getHours();
        let {
            hour,
            minute,
            second
        } = event;

        if (curHours < prevHours) { // which means cross 0:00
            if (hour < curHours) {
                hour += 24;
            }
            curHours += 24;
        }

        let ms = (hour * 3600 + minute * 60 + second) * 1000;
        let pms = (prevHours * 3600 + prevDate.getMinutes() * 60 + prevDate.getSeconds()) * 1000 + prevDate.getMilliseconds();
        let cms = (curHours * 3600 + curDate.getMinutes() * 60 + curDate.getSeconds()) * 1000 + curDate.getMilliseconds();

        if (ms >= pms && ms <= cms) return true;
    } else if (event.type === 'time') {
        let {
            time
        } = event;

        return prevTime <= time && time <= curTime;
    }

    return false;
};

// parse plan document
let parsePlanToTasks = async(indexPlanFile) => {
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

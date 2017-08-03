'use strict';

let fs = require('fs');
let path = require('path');
let promisify = require('es6-promisify');
let interval = require('./interval');
let sendMail = require('./sendMail');
let isTimeMoment = require('./isTimeMoment');
let _ = require('lodash');
let {
    parsePlanTree,
    recoveryPlanFile
} = require('./parser');
let taskBox = require('./sandboxer/taskBox');
let {
    parseStrToAst,
    checkASTWithContext,
    executeAST
} = require('pfc-compiler');

let readFile = promisify(fs.readFile);
let writeFile = promisify(fs.writeFile);

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
            planItemsMap
        } = await parsePlanTree(planIndexFile);

        log(tasks);
        log(focus);

        tasksMap[planConfigPath] = {
            tasks,
            planConfig,
            focus,
            planTaskMap,
            planItemsMap
        };
    };

    let getFocusData = async(planConfigPath) => {
        let plan = getPlan(planConfigPath);
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
        let plan = getPlan(planConfigPath);

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

    let getPlan = (planConfigPath) => {
        if (!planConfigPath) {
            throw new Error('must specify plan config path');
        }

        let plan = tasksMap[planConfigPath];

        if (!plan) {
            throw new Error(`no plan for ${planConfigPath}`);
        }

        return plan;
    };

    let getTask = (planConfigPath, filePath, name) => {
        let plan = getPlan(planConfigPath);
        let {
            planTaskMap
        } = plan;

        let task = planTaskMap[filePath][name];

        if (!task) {
            throw new Error(`no task for ${planConfigPath}, ${filePath}, ${name}`);
        }

        return task;
    };

    let updateTaskByCode = async(code, planConfigPath, filePath, name) => {
        //
        let ast = parseStrToAst(code);
        let context = taskBox(filePath);
        checkASTWithContext(ast, context);

        await reloadPlan(planConfigPath);
        let task = getTask(planConfigPath, filePath, name);
        let value = executeAST(ast, context);
        // update
        task.code = code;
        task.value = value;

        // update file
        let plan = getPlan(planConfigPath);
        let text = recoveryPlanFile(plan.planItemsMap[filePath]);

        await writeFile(filePath, text, 'utf-8');
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
        getDailyTasks,
        getTask,
        updateTaskByCode
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

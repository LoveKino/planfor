'use strict';

let fs = require('fs');
let path = require('path');
let promisify = require('es6-promisify');
let interval = require('./interval');
let sandboxer = require('./sandboxer');
let {
    parseStrToAst, checkASTWithContext, executeAST
} = require('text-flow-pfc-compiler');
let sendMail = require('./sendMail');

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
        let tasks = await parsePlanToTasks(planIndexFile);

        log(tasks);

        // run tasks
        tasksMap[planConfigPath] = {
            tasks,
            planConfig
        };
    };

    interval(1000, (prevTime, curTime) => {
        for (let name in tasksMap) {
            let {
                tasks, planConfig
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
        reloadPlan
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
            hour, minute, second
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

let parsePlanToTasks = async(planFile) => {
    let tasks = [];

    let stack = [planFile];
    let closeMap = {
        [planFile]: true
    };

    while (stack.length) {
        let top = stack.pop(); // current parse plan file
        let planstr = await readFile(top, 'utf-8');
        let ast = parseStrToAst(planstr);

        let contexter = (item, index, tokens) => {
            return Object.assign(sandboxer(item, index, tokens), {
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
                }
            });
        };

        checkASTWithContext(ast, contexter);
        let fileTasks = executeAST(ast, contexter);

        tasks = tasks.concat(fileTasks.filter((item) => item.type === 'pfc' && item.value.type === 'task').map(({
            value
        }) => value));
    }

    return tasks;
};

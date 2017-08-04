'use strict';

let {
    n,
    view
} = require('kabanery');
let _ = require('lodash');
let TaskView = require('./taskView');
let Fold = require('kabanery-fold');
let FoldArrow = require('kabanery-fold/lib/foldArrow');

let {
    STATUS_WORKING,
    STATUS_FINISHED,
    STATUS_DISCARDED,
    STATUS_WAITING
} = require('../../../const');

module.exports = view(({
    taskList,
    planConfigPath
}) => {
    let groups = _.reduce(taskList, (prev, task) => {
        if (task.status === STATUS_WORKING) {
            prev.working.push(task);
        } else if (task.status === STATUS_FINISHED) {
            prev.finished.push(task);
        } else if (task.status === STATUS_WAITING) {
            prev.waiting.push(task);
        } else if (task.status === STATUS_DISCARDED) {
            prev.discarded.push(task);
        }
        return prev;
    }, {
        working: [],
        finished: [],
        waiting: [],
        discarded: []
    });

    return n('ul', [
        groups.working.length && foldTaskList(groups.working, 'working', false, planConfigPath),
        groups.waiting.length && foldTaskList(groups.waiting, 'waiting', true, planConfigPath),
        groups.finished.length && foldTaskList(groups.finished, 'finished', true, planConfigPath),
        groups.discarded.length && foldTaskList(groups.discarded, 'discarded', true, planConfigPath)
    ]);
});

let foldTaskList = (tasks, title, hide, planConfigPath) => {
    return Fold({
        head: (ops) => {
            return n('div', {
                onclick: () => {
                    ops.toggle();
                },

                style: {
                    cursor: 'pointer',
                    padding: 5
                }
            }, [
                FoldArrow(ops),
                n('strong style="padding-left:10px"', title),
            ]);
        },

        body: () => listTask(tasks, planConfigPath),

        hide
    });
};

let listTask = (tasks, planConfigPath) => {
    return n('ul', [
        _.map(tasks, (value) => {
            return TaskView({
                taskValue: value,
                planConfigPath
            });
        })
    ]);
};

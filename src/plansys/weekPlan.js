'use strict';

let timeTasks = require('./timerTasks');

/**
 * manage plan data
 */

module.exports = (planConfig, {
    log
}) => {
    let reminderTasks = [];

    let loadPlanData = (planData) => {
        clearTasks();
        for (let i = 0; i < planData.length; i++) {
            let item = planData[i];
            if (item.type === 'pfc') {
                let value = item.value;
                if (value && typeof value === 'object' && value.type === 'reminder') {
                    let who = value.who || 'myself';
                    let reminder = planConfig.reminder && planConfig.reminder[who];
                    if (!reminder) {
                        log(`missing reminder config for ${who}, unable to send reminder.`);
                    } else {
                        // add reminder to task list.
                        reminderTasks.push(value);
                    }
                }
            }
        }
    };

    let clearTasks = () => {
        reminderTasks = [];
    };

    timeTasks({
        getReminderTasks: () => reminderTasks
    }, planConfig, log);

    return {
        loadPlanData
    };
};

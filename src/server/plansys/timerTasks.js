'use strict';

let nodemailer = require('nodemailer');

module.exports = (planConfig, log) => {
    let reminderTasks = [];

    let checkTimerTasks = (prevTime) => {
        let time = new Date().getTime(); // time duration [prevTime, time]

        for (let i = 0; i < reminderTasks.length; i++) {
            let reminderTask = reminderTasks[i];
            if (reminderTask.time < time && prevTime <= reminderTask.time) {
                // do reminding
                let reminder = planConfig.reminder[reminderTask.who || 'myself'];
                if (reminder.notify === 'email') {
                    mailReminderTask(reminderTask, reminder, log);
                }
            }
        }

        setTimeout(() => checkTimerTasks(time), 2000);
    };

    let startTimeTasks = () => {
        checkTimerTasks(new Date().getTime());
    };

    let loadTimeTasks = (planData) => {
        reminderTasks = [];
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

    return {
        startTimeTasks,
        loadTimeTasks
    };
};

let mailReminderTask = (reminderTask, {
    host,
    port,
    secure,
    auth,
    to
}, log) => {
    let transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth
    });

    transporter.sendMail({
        from: `"planfor-reminder" ${auth.user}`,
        to,
        subject: reminderTask.content.substring(0, 100),
        html: `<b>${reminderTask.content}</b>`
    }, (error, info) => {
        if (error) {
            return log(error);
        }
        log('Message %s sent: %s', info.messageId, info.response);
    });
};

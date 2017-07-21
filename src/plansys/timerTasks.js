'use strict';

let nodemailer = require('nodemailer');

module.exports = ({
    getReminderTasks = emptyArrayFyn
}, planConfig, log) => {
    let checkTimerTasks = (prevTime) => {
        let time = new Date().getTime(); // time duration [prevTime, time]

        let reminderTasks = getReminderTasks();
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

    checkTimerTasks(new Date().getTime());
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

let emptyArrayFyn = () => [];

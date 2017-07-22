'use strict';

let nodemailer = require('nodemailer');

module.exports = (title, content, {
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
        subject: title,
        html: content
    }, (error, info) => {
        if (error) {
            return log(error);
        }
        log('Message %s sent: %s', info.messageId, info.response);
    });
};

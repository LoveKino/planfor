'use strict';

let {
    checkType
} = require('./util');

let action = (content) => {
    return {
        type: 'action',
        content
    };
};

let atomAction = (actionType, info) => {
    return action({
        type: 'atom',
        actionType,
        info
    });
};

let combinatorAction = (actionType, info) => {
    return action({
        type: 'combinator',
        actionType,
        info
    });
};

let sequence = (...actions) => {
    actions.forEach((action) => {
        checkType(action, 'action');
    });

    return combinatorAction('sequence', actions);
};

let concurrent = (...actions) => {
    actions.forEach((action) => {
        checkType(action, 'action');
    });

    return combinatorAction('concurrent', actions);
};

let sendEmail = (title, content) => {
    return atomAction('sendEmail', {
        title,
        content
    });
};

let openUrl = (url, auto = false) => {
    return atomAction('openUrl', {
        url,
        auto
    });
};

let textAction = (text) => {
    text = text || '';
    text = text.trim();
    if (!text) {
        throw new Error('text can not be empty in textAction');
    }
    return atomAction('textAction', {
        text
    });
};

let doNothing = () => {
    return atomAction('doNothing');
};

module.exports = {
    action,
    atomAction,
    sequence,
    concurrent,
    sendEmail,
    openUrl,
    textAction,
    doNothing
};

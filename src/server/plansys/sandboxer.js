'use strict';

let contextText = require('text-flow-pfc-compiler/apply/contextText');

let isType = (v, type) => v && typeof v === 'object' && v.type === type;

let checkType = (v, type, str) => {
    if (!isType(v, type)) {
        throw new Error(str || `Expect type ${type} for data ${v}`);
    }
};

let task = (name, moment, progress, target = 'myself') => {
    checkType(moment, 'moment');
    checkType(progress, 'action');
    // TODO check
    return {
        type: 'task',
        name,
        moment,
        progress,
        target
    };
};

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

let sendEmail = (title, content) => {
    return atomAction('sendEmail', {
        title,
        content
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

let moment = (event) => {
    return {
        type: 'moment',
        event
    };
};

// hour minute
let daily = (clock) => {
    let [hour, minute, second] = clock.split(':');
    hour = Number(hour.trim());
    minute = minute ? Number(minute.trim()) : 0;
    second = second ? Number(second.trim()) : 0;

    return moment({
        type: 'daily',
        hour,
        minute,
        second
    });
};

let time = (timeStr) => {
    // TODO check timeStr
    return moment({
        type: 'time',
        time: new Date(timeStr).getTime()
    });
};

module.exports = (item, index, tokens) => {
    return Object.assign(contextText(item, index, tokens), {
        task,
        daily,
        time,
        sendEmail,
        sequence,
        concurrent
    });
};

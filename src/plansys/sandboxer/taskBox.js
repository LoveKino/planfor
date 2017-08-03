'use strict';

let {
    STATUS_LIST,
    STATUS_NOT_STARTED
} = require('../../const');
let _ = require('lodash');
let {
    checkType
} = require('./util');
let {
    sequence,
    concurrent,
    sendEmail,
    textAction,
    doNothing
} = require('./action');

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

let anyTime = () => {
    return moment({
        type: 'anyTime'
    });
};

let checkStatus = (status) => {
    if (!_.find(STATUS_LIST, (item) => item === status)) {
        throw new Error(`Wrong status for task! status is ${status}`);
    }
};

let taskDef = (moment, progress, target, description = '') => {
    moment = moment || anyTime();
    progress = progress || doNothing();
    target = target || 'myself';

    checkType(moment, 'moment');
    checkType(progress, 'action');

    return {
        type: 'taskDef',
        moment,
        progress,
        target,
        description
    };
};

let taskState = (status) => {
    status = status || STATUS_NOT_STARTED;
    checkStatus(status);

    return {
        type: 'taskState',
        status
    };
};

module.exports = (filePath) => {
    // unique a task by using filePath + name

    /**
     * @param name
     * @param moment
     *   when
     * @param progress
     *   how
     * @param target
     *   who
     * @param status
     */
    let task = (name, def, state) => {
        name = name.trim();
        if (!name) {
            throw new Error('task must have a name.');
        }
        def = def || taskDef();
        state = state || taskState();

        checkType(def, 'taskDef', `task location: (${filePath}, ${name})`);
        checkType(state, 'taskState', `task location: (${filePath}, ${name})`);

        // TODO check
        return {
            type: 'task',
            name,
            filePath,
            moment: def.moment,
            progress: def.progress,
            target: def.target,
            description: def.description,
            status: state.status
        };
    };

    return {
        task,
        taskDef,
        taskState,
        daily,
        time,
        anyTime,
        doNothing,
        sendEmail,
        textAction,
        sequence,
        concurrent
    };
};

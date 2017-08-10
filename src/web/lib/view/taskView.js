'use strict';

let {
    view,
    n
} = require('kabanery');
let Fold = require('kabanery-fold');
let FoldArrow = require('kabanery-fold/lib/foldArrow');
let _ = require('lodash');
let {
    displayClock
} = require('../util/time');
let AtomActionView = require('./atomActionView');

module.exports = view(({
    taskValue,
    planConfigPath
}) => {
    return n('li class="card"', {
        style: {
            backgroundColor: 'white',
            fontSize: 16
        }
    }, [
        line('name', n('span style="font-size:18px;color:rgb(0,161,241);font-weight:bold;"', taskValue.name)),
        line('filePath', prettyFilePath(taskValue.filePath)),
        line('moment', displayMoment(taskValue)),
        line('status', taskValue.status),
        taskValue.description && line('description', taskValue.description),
        taskValue.progress && lineBlock('progress', displayProgress(taskValue.progress)),

        n(`a href="?page=editTask&planConfigPath=${planConfigPath}&filePath=${taskValue.filePath}&name=${taskValue.name}"`, {
            style: {
                marginTop: 8,
                display: 'block'
            }
        }, 'edit')
    ]);
});

let line = (key, value) => {
    return n('div', {
        style: {
            padding: '4px 0'
        }
    }, [
        n('span', {
            style: {
                display: 'inline-block',
                width: 80,
                fontWeight: 'bold'
            }
        }, key), n('span', value)
    ]);
};

let lineBlock = (key, value, showDetail) => {
    let body = () => value;
    let head = (ops) => n('div', {
        onclick: () => {
            ops.toggle();
        },
        style: {
            cursor: 'pointer'
        }
    }, [
        FoldArrow(ops), n('strong', `${key}`)
    ]);

    return Fold({
        head,
        body,
        hide: !showDetail
    });
};

let prettyFilePath = (filePath) => {
    let parts = filePath.split('/');
    if (parts.length < 3) return filePath;
    return `.../${parts.slice(parts.length - 3).join('/')}`;
};

let displayProgress = (progress) => {
    // TODO convert progress to steps
    let steps = compactAction(progress);

    return n('ul', [
        steps.map(({
            actionType,
            info
        }) => {
            return n('li', {
                style: {
                    fontSize: 14,
                    marginLeft: 28,
                    'list-style': 'square !important'
                }
            }, [
                AtomActionView({
                    actionType,
                    info
                })
            ]);
        })
    ]);
};

let compactAction = (action) => {
    let content = action.content;

    if (content.type === 'atom') {
        return [content];
    } else {
        if (content.actionType === 'sequence' || content.actionType === 'concurrent') {
            let info = content.info;
            return _.reduce(info, (prev, next) => {
                return prev.concat(compactAction(next));
            }, []);
        }
    }
};

let displayMoment = (taskValue) => {
    let event = taskValue.moment.event;
    let type = taskValue.moment.event.type;

    if (type === 'daily') {
        return n('span', `${type} ${displayClock(event.hour, event.minute)}`);
    }

    return n('span', type);
};

'use strict';

let {
    view,
    n
} = require('kabanery');
let Fold = require('kabanery-fold');
let FoldArrow = require('kabanery-fold/lib/foldArrow');
let _ = require('lodash');

let {
    STATUS_NOT_STARTED,
    STATUS_FINISHED,
    STATUS_WORKING
} = require('../../../const');

let colorMap = {
    [STATUS_NOT_STARTED]: '#999999',
    [STATUS_FINISHED]: 'rgb(111,140,29)',
    [STATUS_WORKING]: 'white'
};

module.exports = view(({
    taskValue,
    planConfigPath
}) => {
    let backgroundColor = colorMap[taskValue.status];

    return n('li class="card"', {
        style: {
            backgroundColor,
            fontSize: 16
        }
    }, [
        line('name', taskValue.name),
        line('filePath', prettyFilePath(taskValue.filePath)),
        line('moment', taskValue.moment.event.type),
        line('status', taskValue.status),
        taskValue.description && line('description', taskValue.description),
        taskValue.progress && lineBlock('progress', displayProgress(taskValue.progress), taskValue.status === STATUS_WORKING),

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
        n('strong', `${key}:`), n('span style="padding-left:8px"', value)
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
                    marginLeft: 28,
                    'list-style': 'square !important'
                }
            }, [
                displayAtomAction(actionType, info)
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

let displayAtomAction = (actionType, info) => {
    if (atomActionDisplayMap[actionType]) {
        return n('span', atomActionDisplayMap[actionType](info));
    }

    return n('span', `${actionType}: ${info? JSON.stringify(info): '...'}`);
};

let atomActionDisplayMap = {
    'textAction': (info) => info.text
};

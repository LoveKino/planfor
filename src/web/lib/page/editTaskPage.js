'use strict';

let {
    view,
    n
} = require('kabanery');
let queryString = require('queryString');
let TaskEditor = require('../view/taskEditor');
let Notice = require('kabanery-modal/lib/notice');

let PageView = view(({
    taskData,
    planConfigPath,
    filePath,
    name,
    notice
}, {
    update
}) => {
    return n('div', {
        style: {
            padding: 8
        }
    }, [
        n('button', {
            onclick: () => {
                // TODO check pfc grammer
                fetch('/api/task/update/code', {
                    method: 'POST',
                    body: JSON.stringify({
                        code: taskData.data.code,
                        planConfigPath,
                        filePath,
                        name
                    })
                }).then(res => res.json()).then(({
                    errno,
                    errMsg
                }) => {
                    // TODO notify
                    if (errno === 0) {
                        update([
                            ['notice.title', 'saved!'],
                            ['notice.disappear', false]
                        ]);
                    } else {
                        update([
                            ['notice.title', errMsg],
                            ['notice.disappear', false]
                        ]);
                    }
                }).catch(err => {
                    // TODO notify
                    update([
                        ['notice.title', err.toString()],
                        ['notice.disappear', false]
                    ]);

                });
            }
        }, 'save'),

        taskData && (taskData.errno === 0 ? TaskEditor({
            code: taskData.data.code,
            onchange: (newCode) => {
                taskData.data.code = newCode;
            }
        }) : n('div', taskData.errMsg)),

        Notice(notice)
    ]);
});

module.exports = () => {
    let qs = queryString.parse(window.location.search.substring(1));

    let pageView = PageView({
        taskData: null,
        planConfigPath: qs.planConfigPath,
        filePath: qs.filePath,
        name: qs.name,
        notice: {
            disappear: true,
            autoHide: true
        }
    });

    fetch(`/api/task?planConfigPath=${qs.planConfigPath}&filePath=${qs.filePath}&name=${qs.name}`).then((res) => res.json()).then((taskData) => {
        pageView.ctx.update('taskData', taskData);
    });

    return pageView;
};

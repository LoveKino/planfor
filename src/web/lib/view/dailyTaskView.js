'use strict';
let {
    n,
    view
} = require('kabanery');
let TaskListView = require('./taskListView');
let {
    displayClock
} = require('../util/time');

module.exports = view((data) => {
    let dailyList = data.dailyList;

    dailyList.sort((item1, item2) => {
        let h1 = item1.moment.event.hour;
        let m1 = item1.moment.event.minute;
        let h2 = item2.moment.event.hour;
        let m2 = item2.moment.event.minute;

        if (h1 > h2) return 1;
        if (h1 < h2) return -1;
        if (m1 > m2) return 1;
        if (m1 < m2) return -1;
        return 0;
    });

    return n('ul', [
        TimeView(),
        TaskListView({
            taskList: dailyList,
            planConfigPath: data.planConfigPath
        })
    ]);
});

let TimeView = view(({
    duration = 5000
} = {}, {
    update
}) => {
    let date = new Date();
    setInterval(() => {
        date = new Date();
        update();
    }, duration);

    return () => n('div', `${displayClock(date.getHours(), date.getMinutes())}`);
});

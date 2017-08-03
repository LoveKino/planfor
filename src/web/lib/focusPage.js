'use strict';

let {
    n,
    view
} = require('kabanery');
let queryString = require('queryString');
let _ = require('lodash');

let FocusTaskListView = view((data) => {
    return n('ul', [
        _.map(data, ({
            type,
            value
        }) => {
            if (type === 'pfc') {
                let sourceValue = value.sourceTask.value;
                return TaskView(sourceValue);
            }
        })
    ]);
});

let DailyTaskListView = view((data) => {
    return n('ul', [
        _.map(data, (value) => {
            return TaskView(value);
        })
    ]);
});

let TaskView = view((taskValue) => {
    return n('li class="card"', [
        n('strong', 'name:'), n('span style="padding-left:8px"', taskValue.name), n('br'),
        n('strong', 'moment:'), n('span style="padding-left:8px"', taskValue.moment.event.type), n('br')
    ]);
});

let PageView = view((pageData) => {
    return n('page', [
        n('div', {
            style: {
                padding: 10
            }
        }, [
            n('h3', 'plan focus'),

            pageData.focusData && (pageData.focusData.errno === 0 ? FocusTaskListView(pageData.focusData.data) : n('div', pageData.focusData.errMsg))
        ]),

        n('div', {
            style: {
                padding: 10
            }
        }, [
            n('h3', 'daily plans'),

            pageData.dailyData && (pageData.dailyData.errno === 0 ? DailyTaskListView(pageData.dailyData.data) : n('div', pageData.dailyData.errMsg))
        ])
    ]);
});

module.exports = () => {
    let qs = queryString.parse(window.location.search.substring(1));

    let pageView = PageView({
        focusData: null,
        dailyData: null
    });

    fetch(`/api/plan/focus?planConfigPath=${qs.planConfigPath}`).then((res) => res.json()).then((focusData) => {
        pageView.ctx.update('focusData', focusData);
    });

    fetch(`/api/plan/daily?planConfigPath=${qs.planConfigPath}`).then((res) => res.json()).then((dailyData) => {
        pageView.ctx.update('dailyData', dailyData);
    });

    return pageView;
};

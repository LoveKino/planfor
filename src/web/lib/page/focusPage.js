'use strict';

let {
    n,
    view
} = require('kabanery');
let queryString = require('queryString');
let _ = require('lodash');
let TaskListView = require('../view/taskListView');
let DailyTaskListView = require('../view/dailyTaskView');
let {
    displayDate
} = require('../util/time');

let FocusTaskListView = view((data) => {
    return n('ul', [
        TaskListView({
            taskList: _.reduce(data.focusList, (prev, {
                type,
                value
            }) => {
                if (type === 'pfc') {
                    let sourceValue = value.sourceTask.value;
                    prev.push(sourceValue);
                }

                return prev;
            }, []),

            planConfigPath: data.planConfigPath
        })
    ]);
});

let getFocusItemValue = (focusItems, type) => {
    let list = _.filter(focusItems, (item) => item.type === 'pfc' && item.value.type === type);

    return list && list[0].value;
};

let PageView = view((pageData) => {
    let focusList = pageData.focusData && _.filter(pageData.focusData.data, (item) => item.type === 'pfc' && item.value.type === 'linkTask');
    let expectationTime = pageData.focusData && getFocusItemValue(pageData.focusData.data, 'expectationTime');
    let slogon = pageData.focusData && getFocusItemValue(pageData.focusData.data, 'slogon');

    return n('page', [
        n('div', {
            style: {
                padding: 10
            }
        }, [
            n('h3', 'plan focus'),

            slogon && n('div', {
                style: {
                    padding: 10,
                    fontSize: 20
                }
            }, slogon.text),

            expectationTime && n('div', {
                style: {
                    padding: 10,
                    fontSize: 18
                }
            }, `expectation time ${displayDate(new Date(expectationTime.from))} - ${displayDate(new Date(expectationTime.to))}`),

            pageData.focusData && (pageData.focusData.errno === 0 ? FocusTaskListView({
                focusList,
                planConfigPath: pageData.planConfigPath
            }) : n('div', pageData.focusData.errMsg))
        ]),

        n('div', {
            style: {
                padding: 10
            }
        }, [
            n('h3', 'daily plans'),

            pageData.dailyData && (pageData.dailyData.errno === 0 ? DailyTaskListView({
                dailyList: pageData.dailyData.data,
                planConfigPath: pageData.planConfigPath
            }) : n('div', pageData.dailyData.errMsg))
        ])
    ]);
});

module.exports = () => {
    let qs = queryString.parse(window.location.search.substring(1));

    let pageView = PageView({
        focusData: null,
        dailyData: null,
        planConfigPath: qs.planConfigPath
    });

    fetch(`/api/plan/focus?planConfigPath=${qs.planConfigPath}`).then((res) => res.json()).then((focusData) => {
        pageView.ctx.update('focusData', focusData);
    });

    fetch(`/api/plan/daily?planConfigPath=${qs.planConfigPath}`).then((res) => res.json()).then((dailyData) => {
        pageView.ctx.update('dailyData', dailyData);
    });

    return pageView;
};

'use strict';

let displayClock = (hour, minute) => {
    if (hour < 10) hour = '0' + hour;
    if (minute < 10) minute = '0' + minute;
    return hour + ':' + minute;
};

let displayDate = (d) => `${d.getFullYear()}-${completeNum(d.getMonth() + 1)}-${completeNum(d.getDate())}`;

let completeNum = (num) => {
    if (num < 10) return '0' + num;
    return num + '';
};

module.exports = {
    displayClock,
    displayDate
};

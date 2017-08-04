'use strict';

let displayClock = (hour, minute) => {
    if (hour < 10) hour = '0' + hour;
    if (minute < 10) minute = '0' + minute;
    return hour + ':' + minute;
};

module.exports = {
    displayClock
};

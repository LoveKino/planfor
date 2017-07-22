'use strict';

let overDay = (date1, lineDate) => {
    if (date1.getFullYear() < lineDate.getFullYear()) return false;
    if (date1.getFullYear() > lineDate.getFullYear()) return true;

    if (date1.getMonth() < lineDate.getMonth()) return false;
    if (date1.getMonth() > lineDate.getMonth()) return true;

    if (date1.getDate() < lineDate.getDate()) return false;
    if (date1.getDate() > lineDate.getDate()) return true;

    return false;
};

let displayDate = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

module.exports = {
    overDay,
    displayDate
};

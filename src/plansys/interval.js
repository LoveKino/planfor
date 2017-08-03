'use strict';

module.exports = (gap, handler) => {
    let job = (prevTime) => {
        let curTime = new Date().getTime();
        handler && handler(prevTime, curTime);

        setTimeout(() => {
            job(curTime);
        }, gap);
    };

    job(new Date().getTime());
};

module.exports = (prevTime, curTime, event) => {
    let prevDate = new Date(prevTime);
    let curDate = new Date(curTime);

    if (event.type === 'daily') {
        let prevHours = prevDate.getHours();
        let curHours = curDate.getHours();
        let {
            hour,
            minute,
            second
        } = event;

        if (curHours < prevHours) { // which means cross 0:00
            if (hour < curHours) {
                hour += 24;
            }
            curHours += 24;
        }

        let ms = (hour * 3600 + minute * 60 + second) * 1000;
        let pms = (prevHours * 3600 + prevDate.getMinutes() * 60 + prevDate.getSeconds()) * 1000 + prevDate.getMilliseconds();
        let cms = (curHours * 3600 + curDate.getMinutes() * 60 + curDate.getSeconds()) * 1000 + curDate.getMilliseconds();

        if (ms >= pms && ms <= cms) return true;
    } else if (event.type === 'time') {
        let {
            time
        } = event;

        return prevTime <= time && time <= curTime;
    }

    return false;
};

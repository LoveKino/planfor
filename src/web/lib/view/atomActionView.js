'use strict';

let {
    view,
    n
} = require('kabanery');

module.exports = view(({
    actionType,
    info
}) => {
    if (actionType === 'textAction') {
        return n('span', info.text);
    }

    if(actionType === 'openUrl') {
        return n('div', [
            n('span', 'openUrl'),
            n('span style="padding-left: 10px"'),
            n(`a href="${info.url}" target="blank"`, info.url)
        ]);
    }

    return n('span', `${actionType}: ${info? JSON.stringify(info): '...'}`);
});

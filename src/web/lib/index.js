'use strict';

let {
    router,
    queryPager
} = require('kabanery-spa');
let {
    n,
    mount
} = require('kabanery');
let focusPage = require('./page/focusPage');
let editTaskPage = require('./page/editTaskPage');

mount(n('div id="pager"'), document.body);

let {
    forward
} = router(queryPager({
    'focusPage': {
        title: 'focusPage',
        render: focusPage
    },
    'editTask': {
        title: 'editTask',
        render: editTaskPage
    }
}, 'focusPage'));

forward(window.location.href);

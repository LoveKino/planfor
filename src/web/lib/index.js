'use strict';

let {
    router,
    queryPager
} = require('kabanery-spa');
let {
    n,
    mount
} = require('kabanery');
let focusPage = require('./focusPage');

mount(n('div id="pager"'), document.body);

let {
    forward
} = router(queryPager({
    'focusPage': {
        title: 'focusPage',
        render: focusPage
    }
}, 'focusPage'));

forward(window.location.href);

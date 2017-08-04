'use strict';

let {
    n,
    view
} = require('kabanery');

let {
    format
} = require('pfc-formatter');

module.exports = view((data) => {
    data.code = format(data.code);

    return n('div', {
        style: {
            padding: 8
        }
    }, [
        n('textarea placeholder="task content" wrap="off"', {
            style: {
                width: '100%',
                height: 400,
                outline: 'none',
                resize: 'none',
                overflow: 'auto',
                border: '1px solid #888',
                borderRadius: 5,
                fontSize: 16,
                padding: 5
            },

            oninput: (e) => {
                data.code = e.target.value;
                data.onchange && data.onchange(data.code);
            }
        }, data.code)
    ]);
});

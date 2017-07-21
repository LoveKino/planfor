'use strict';

let {
    launchServer, startClient
} = require('../..');

let {
    delay
} = require('jsenhance');

describe('index', () => {
    it('base', async() => {
        let config = {
            reminder: {
                myself: {}
            }
        };
        await launchServer(config);
        let {
            loadWeekPlan
        } = await startClient(config);

        let date = new Date();

        await loadWeekPlan(`123{:reminder(${date.getTime() + 3 * 1000}, "go out"):}`);

        await delay(6000);
    });
});

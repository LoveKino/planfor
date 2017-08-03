'use strict';

let path = require('path');
let contextText = require('text-flow-pfc-compiler/apply/contextText');
let taskBox = require('./taskBox');

module.exports = (filePath) => (item, index, tokens) => {
    let planFocus = (planPath) => {
        planPath = path.join(filePath, '..', planPath);
        return {
            type: 'planFocus',
            planPath
        };
    };

    return Object.assign(contextText(item, index, tokens), taskBox(filePath), {
        planFocus
    });
};

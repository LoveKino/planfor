'use strict';

let isType = (v, type) => v && typeof v === 'object' && v.type === type;

let checkType = (v, type, str = '') => {
    if (!isType(v, type)) {
        throw new Error(`Expect type ${type} for data ${JSON.stringify(v, null, 4)}. ${str}}`);
    }
};

module.exports = {
    isType,
    checkType
};

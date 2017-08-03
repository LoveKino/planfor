module.exports = {
    entry: {
        app: './lib/index.js'
    },

    output: {
        path: __dirname + '/assets',
        filename: '[name].js'
    }
};

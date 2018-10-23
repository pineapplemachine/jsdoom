const path = require('path');

module.exports = {
    entry: './dist/web/inspector.js',
    resolve: {
        alias: {
            "@test": path.resolve(__dirname, './dist/test'),
            "@src": path.resolve(__dirname, './dist/src'),
        }
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'webpack-bundle.js'
    },
};

const path = require('path');

module.exports = {
    entry: './dist/web/inspector.js',
    mode: "development",
    resolve: {
        alias: {
            "@test": path.resolve(__dirname, './dist/test'),
            "@src": path.resolve(__dirname, './dist/src'),
            "@web": path.resolve(__dirname, './dist/web'),
        }
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'webpack-bundle.js'
    },
    // uncomment the following line to shut the Firefox developer tools up
    // devtool: "source-map",
};

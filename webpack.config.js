'use strict';

const webpack = require('webpack');

exports.entry   = './client/app.js';
exports.output  = { filename: 'bundle.js', path: `${__dirname}/dist` };
exports.devtool = 'source-map';

exports.plugins = [
  new webpack.ProvidePlugin({
    '$'             : 'jquery',
    'jQuery'        : 'jquery',
    'jquery'        : 'jquery',
    'window.jQuery' : 'jquery'
  })
];

'use strict';

const fs                    = require('fs');
const os                    = require('os');
const path                  = require('path');
const webpack               = require('webpack');
const WebpackMd5Hash        = require('webpack-md5-hash');
const WebpackOnBuildPlugin  = require('on-build-webpack');
const ClosureCompilerPlugin = require('webpack-closure-compiler');

const { ProvidePlugin }      = webpack;
const { CommonsChunkPlugin } = webpack.optimize;

const INDEX_HTML_PATH     = `${__dirname}/public/index.html`;
const CLOSURE_CONCURRENCY = os.cpus().length - 1;

// -----------------------------------------------------------------------------
// CONFIG
// -----------------------------------------------------------------------------

exports.entry = {
  app    : './client/app.js',
  vendor : [
    'jquery',
    'bootstrap/dist/js/bootstrap.js',
    'marked',
    'angular',
    'angular-route',
    'angulartics',
    'angulartics-google-analytics'
  ]
};

exports.output  = { filename: '[name]-[chunkhash:6].js', path: `${__dirname}/dist` };
exports.devtool = 'source-map';

exports.plugins = [
  new ProvidePlugin({
    '$'             : 'jquery',
    'jQuery'        : 'jquery',
    'jquery'        : 'jquery',
    'window.jQuery' : 'jquery'
  }),
  new CommonsChunkPlugin({ name: 'vendor', minChunks: Infinity }),
  new WebpackMd5Hash(),
  new WebpackOnBuildPlugin(res => {
    updateHashes(res);
  }),
  new ClosureCompilerPlugin({
    concurrency : CLOSURE_CONCURRENCY,
    compiler    : {
      language_in       : 'ECMASCRIPT6_STRICT',
      language_out      : 'ECMASCRIPT5_STRICT',
      compilation_level : 'SIMPLE_OPTIMIZATIONS',
      // create_source_map : true
    }
  })
];

// -----------------------------------------------------------------------------
// POSTBUILD TASKS
// -----------------------------------------------------------------------------

function updateHashes(compilationResult) {
  const filesAndEntries = compilationResult.compilation.chunks.map(it => [ it.name, it.files[0] ]);
  const filesByEntry    = new Map(filesAndEntries);

  const indexHtmlFile = path.resolve(INDEX_HTML_PATH);
  const content       = fs.readFileSync(indexHtmlFile, 'utf8');

  const newContent = content.replace(/\/dist\/(\w+)-\w+\.js/g, (match, name) => {
    const newName     = filesByEntry.get(name);
    const replacement = `/dist/${newName}`;
    console.log(`Replacing entry "${name}" by "${replacement}" in file ${indexHtmlFile}`);
    return replacement;
  });

  fs.writeFileSync(indexHtmlFile, newContent, 'utf8');
}

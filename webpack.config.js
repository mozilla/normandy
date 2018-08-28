/* eslint-env node */
/* eslint-disable no-var, func-names, prefer-arrow-callback, prefer-template, comma-dangle */
var path = require('path');
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var BabiliPlugin = require('babili-webpack-plugin');
var childProcess = require('child_process');
var babiliPreset = require('babel-preset-babili');
var babelCore = require('@babel/core');

const BOLD = '\u001b[1m';
const END_BOLD = '\u001b[39m\u001b[22m';
const production = process.env.NODE_ENV === 'production';
const cssNamePattern = production ? '[name].[hash].css' : '[name].css';
const jsNamePattern = production ? '[name].[hash].js' : '[name].js';

var plugins = [
  // Note: This matches Django's idea of what a hashed url looks like. Be careful when changing it!
  new ExtractTextPlugin({
    allChunks: true,
    filename: cssNamePattern,
  }),
  new webpack.DefinePlugin({
    PRODUCTION: production,
    DEVELOPMENT: !production,
    process: {
      env: {
        NODE_ENV: production ? '"production"' : '"development"',
      },
    },
  }),
];

if (production) {
  plugins = plugins.concat([
    new BabiliPlugin(
      { // babiliOptions
        evaluate: false, // mozilla/normandy#827
      },
      { // overrides
        // Use our own pinned versions of babel and babili in case deduplication fails
        babel: babelCore,
        babili: babiliPreset,
      }
    ),
  ]);
} else {
  plugins = plugins.concat([
    new webpack.NoEmitOnErrorsPlugin(),
  ]);
}

module.exports = function (webpackEnvOptions) {
  var envOptions = webpackEnvOptions || {
    'update-actions': false,
  };

  return [
    {
      devtool: production ? undefined : 'cheap-module-source-map',

      entry: {
        'console-log': './client/actions/console-log/index',
        'show-heartbeat': './client/actions/show-heartbeat/index',
        'preference-experiment': './client/actions/preference-experiment/index',
        'opt-out-study': './client/actions/opt-out-study/index',
      },

      plugins: plugins.concat([
        new BundleTracker({ filename: './webpack-stats-actions.json' }),
        // Small plugin to update the actions in the database if
        // --env.update-actions was passed.
        function updateActions() {
          this.plugin('done', function () {
            var cmd;
            if (envOptions['update-actions']) {
              // Don't disable actions since this is mostly for development.
              cmd = 'python manage.py update_actions';

              childProcess.exec(cmd, function (err, stdout, stderr) {
                console.log('\n' + BOLD + 'Updating Actions' + END_BOLD);
                console.log(stdout);
                if (stderr) {
                  console.error(stderr);
                }
              });
            }
          });
        },
      ]),

      output: {
        path: path.resolve('./assets/bundles/'),
        filename: jsNamePattern,
      },

      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
          },
        ],
      },
    },
  ];
};

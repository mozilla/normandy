/* eslint-disable no-var, func-names, prefer-arrow-callback, prefer-template */
var path = require('path');
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var argv = require('yargs').argv;
var childProcess = require('child_process');


const BOLD = '\u001b[1m';
const END_BOLD = '\u001b[39m\u001b[22m';


module.exports = [
  {
    context: __dirname,

    entry: {
      selfrepair: [
        'babel-polyfill',
        './normandy/selfrepair/static/js/self_repair',
      ],
      control: [
        'babel-polyfill',
        './normandy/control/static/control/js/index',
        './normandy/control/static/control/admin/sass/control.scss',
        './node_modules/font-awesome/scss/font-awesome.scss',
      ],
    },

    output: {
      path: path.resolve('./assets/bundles/'),
      filename: '[name]-[hash].js',
      chunkFilename: '[id].bundle.js',
    },

    plugins: [
      new BundleTracker({ filename: './webpack-stats.json' }),
      new ExtractTextPlugin('[name]-[hash].css'),
      new webpack.ProvidePlugin({
        fetch: 'exports?self.fetch!isomorphic-fetch',
      }),
    ],

    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel',
        },
        {
          test: /\.scss$/,
          loader: ExtractTextPlugin.extract('style', 'css?sourceMap!postcss!sass?sourceMap'),
        },
        {
          test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
          loader: 'file-loader',
        },
      ],
    },
  },
  {
    entry: {
      'console-log': './normandy/recipes/static/actions/console-log/index',
      'show-heartbeat': './normandy/recipes/static/actions/show-heartbeat/index',
    },

    plugins: [
      new BundleTracker({ filename: './webpack-stats-actions.json' }),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }),

        // Small plugin to update the actions in the database if
        // --update-actions was passed.
      function updateActions() {
        var cmd;
        this.plugin('done', function () {
          if (argv['update-actions']) {
              // Don't disable actions since this is mostly for development.
            cmd = 'python manage.py update_actions --no-disable';

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
    ],

    output: {
      path: path.resolve('./assets/bundles/'),
      filename: '[name]-[hash].js',
    },

    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          query: {
            plugins: [
                ['transform-runtime', {
                  polyfill: false,
                  regenerator: true,
                }],
            ],
          },
        },
      ],
    },
  },
];

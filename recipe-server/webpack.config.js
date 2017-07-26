/* eslint-env node */
/* eslint-disable no-var, func-names, prefer-arrow-callback, prefer-template, comma-dangle */
var path = require('path');
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var AsyncAwaitPlugin = require('webpack-async-await');
var BabiliPlugin = require('babili-webpack-plugin');
var argv = require('yargs').argv;
var childProcess = require('child_process');
var babiliPreset = require('babel-preset-babili');
var babelCore = require('babel-core');

const BOLD = '\u001b[1m';
const END_BOLD = '\u001b[39m\u001b[22m';
const production = process.env.NODE_ENV === 'production';
const cssNamePattern = production ? '[name].[hash].css' : '[name].css';
const jsNamePattern = production ? '[name].[hash].js' : '[name].js';

var plugins = [
  new AsyncAwaitPlugin({
    // Workaround for https://github.com/substack/node-browserify/issues/1668
    // Once we update to webpack2, we can update this plugin and remove this.
    awaitAnywhere: true,
  }),
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
  new webpack.DllReferencePlugin({
    context: '.',
    manifest: path.resolve('./assets/bundles/vendor-manifest.json'),
  })
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

module.exports = [
  {
    context: __dirname,
    devtool: production ? undefined : 'cheap-eval-source-map',

    entry: {
      control: [
        'babel-polyfill',
        './client/control/index.js',
        './client/control/sass/control.scss',
        './node_modules/font-awesome/scss/font-awesome.scss',
      ],
      control_new: [
        'babel-polyfill',
        './client/control_new/index.js',
        './client/control_new/less/main.less',
      ],
    },

    output: {
      path: path.resolve('./assets/bundles/'),
      filename: jsNamePattern,
      chunkFilename: '[id].bundle.js',
    },
    externals: {
      'react/lib/ExecutionEnvironment': true,
      'react/lib/ReactContext': true,
      'react/addons': true,
    },

    plugins: plugins.concat([
      new BundleTracker({ filename: './webpack-stats.json' }),
    ]),

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
        },
        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract({
            allChunks: true,
            fallback: 'style-loader',
            use: [
              'css-loader?sourceMap',
              'postcss-loader',
              'sass-loader?sourceMap',
            ],
          }),
        },
        {
          test: /\.less$/,
          exclude: /node_modules/,
          use: ExtractTextPlugin.extract({
            allChunks: true,
            fallback: 'style-loader',
            use: [
              'css-loader?sourceMap',
              'less-loader',
            ],
          }),
        },
        {
          test: /\.(png|ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
          loader: 'file-loader',
        },
      ],
    },

    resolve: {
      alias: {
        client: path.resolve(__dirname, './client'),
        actions: path.resolve(__dirname, './client/actions'),
        control: path.resolve(__dirname, './client/control'),
        tests: path.resolve(__dirname, './client/tests'),
        control_new: path.resolve(__dirname, './client/control_new'),
      },
    },

    node: {
      fs: 'empty',
    },
  },
  {
    devtool: production ? undefined : 'cheap-eval-source-map',

    entry: {
      'console-log': './client/actions/console-log/index',
      'show-heartbeat': './client/actions/show-heartbeat/index',
      'preference-experiment': './client/actions/preference-experiment/index',
    },

    plugins: plugins.concat([
      new BundleTracker({ filename: './webpack-stats-actions.json' }),
      // Small plugin to update the actions in the database if
      // --update-actions was passed.
      function updateActions() {
        this.plugin('done', function () {
          var cmd;
          if (argv['update-actions']) {
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

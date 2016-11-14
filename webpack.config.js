/* eslint-env node */
/* eslint-disable no-var, func-names, prefer-arrow-callback, prefer-template */
var path = require('path');
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var argv = require('yargs').argv;
var childProcess = require('child_process');

const BOLD = '\u001b[1m';
const END_BOLD = '\u001b[39m\u001b[22m';
const production = process.env.NODE_ENV === 'production';

var plugins = [
  new BundleTracker({ filename: './webpack-stats.json' }),
  new webpack.optimize.OccurrenceOrderPlugin(true),
  new ExtractTextPlugin(production ? '[name]-[hash].css' : '[name].css'),
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
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    }),
  ]);
} else {
  plugins = plugins.concat([
    new webpack.NoErrorsPlugin(),
  ]);
}

module.exports = [
  {
    context: __dirname,
    devtool: production ? undefined : 'cheap-module-eval-source-map',

    entry: {
      selfrepair: [
        'babel-polyfill',
        './client/selfrepair/self_repair.js',
      ],
      control: [
        'babel-polyfill',
        './client/control/index.js',
        './client/control/sass/control.scss',
        './node_modules/font-awesome/scss/font-awesome.scss',
      ],
    },

    output: {
      path: path.resolve('./assets/bundles/'),
      filename: production ? '[name]-[hash].js' : '[name].js',
      chunkFilename: '[id].bundle.js',
    },
    externals: {
      'react/lib/ExecutionEnvironment': true,
      'react/lib/ReactContext': true,
      'react/addons': true,
    },

    plugins,

    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel',
        },
        {
          test: /\.json$/,
          loader: 'json-loader',
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

    resolve: {
      alias: {
        app: path.resolve(__dirname, './client/control/app.js'),
        reducers: path.resolve(__dirname, './client/control/reducers'),
        actions: path.resolve(__dirname, './client/control/actions'),
        components: path.resolve(__dirname, './client/control/components'),
      },
    },
  },
  {
    devtool: production ? undefined : 'cheap-module-eval-source-map',

    entry: {
      'console-log': './client/actions/console-log/index',
      'show-heartbeat': './client/actions/show-heartbeat/index',
    },

    plugins: [
      new BundleTracker({ filename: './webpack-stats-actions.json' }),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }),

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
    ],

    output: {
      path: path.resolve('./assets/bundles/'),
      filename: production ? '[name]-[hash].js' : '[name].js',
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

/* eslint-disable func-names, no-var */
// Karma configuration
module.exports = function (config) {
  var karmaConfig = {
        // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'node_modules/jasmine-promises/dist/jasmine-promises.js',
      'normandy/control/tests/index.js',
      'normandy/recipes/tests/actions/index.js',
      'normandy/selfrepair/tests/index.js',
    ],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'normandy/control/tests/index.js': ['webpack', 'sourcemap'],
      'normandy/recipes/tests/actions/index.js': ['webpack', 'sourcemap'],
      'normandy/selfrepair/tests/index.js': ['webpack', 'sourcemap'],
      'normandy/control/static/control/js/components/*.js': ['react-jsx'],
    },

    webpack: {
      module: {
        loaders: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel',
          },
          {
            test: /(\.|\/)(json)$/,
            loader: 'json',
          },
        ],
      },
      devtool: 'inline-source-map',
    },

    webpackServer: {
      quiet: true, // Suppress *all* webpack messages, including errors
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['spec'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // possible values: config.LOG_DISABLE, config.LOG_ERROR, config.LOG_WARN,
    // config.LOG_INFO, or config.LOG_DEBUG.
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Firefox'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,
  };

  config.set(karmaConfig);
};

#!/usr/bin/env node
/* eslint-disable no-var, prefer-template */
var path = require('path');
var karma = require('karma');
var karmaConfig = require('karma/lib/config');

const JUNIT_OUTPUT = process.env.JUNIT_OUTPUT || '/artifacts/test_results/karma';

var config = karmaConfig.parseConfig(
  path.join(__dirname, '/../karma.conf.js'),
  {
    browsers: [],
    oneShot: true,
    reporters: ['spec', 'junit'],
    junitReporter: {
      outputDir: JUNIT_OUTPUT,
    },
    hostname: '0.0.0.0',
  },
);

var server = new karma.Server(config);

server.on('run_complete', (browsers, results) => {
  var error = results.error || results.failed > 0;

  server.emitAsync('exit').then(() => {
    process.exit(error ? 1 : 0);
  });
});

server.on('load_error', () => {
  process.exit(1);
});

server.start();

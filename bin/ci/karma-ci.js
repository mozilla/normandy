/* eslint-disable no-var, prefer-template */
var karma = require('karma');
var karmaConfig = require('karma/lib/config');

var config = karmaConfig.parseConfig(__dirname + '/../../karma.conf.js', {
  browsers: [],
  oneShot: true,
  reporters: ['spec', 'junit'],
  junitReporter: {
    outputDir: '/test_artifacts',
  },
});

var server = new karma.Server(config);

server.on('run_complete', (browsers, results) => {
  var error = results.error || results.failed > 0;

  server.emitAsync('exit')
  .then(() => {
    process.exit(error ? 1 : 0);
  });
});

server.start();

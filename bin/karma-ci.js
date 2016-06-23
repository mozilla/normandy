var karma = require('karma');
var karmaConfig = require('karma/lib/config');

var config = karmaConfig.parseConfig(__dirname + '/../karma.conf.js', {
  browsers: [],
  oneShot: true,
});

var server = new karma.Server(config);

server.on('browser_complete', (completedBrowser) => {
  if (completedBrowser.lastResult.error || completedBrowser.lastResult.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});

server.start();

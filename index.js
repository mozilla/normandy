const self = require('sdk/self');
const loader = require('./lib/loader.js');

exports.main = function() {
  loader.runWorker();
}

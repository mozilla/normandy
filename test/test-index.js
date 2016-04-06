const {Storage} = require('../lib/Storage.js');
const {promiseTest} = require('./utils.js');

exports['test set and get'] = promiseTest(assert => {
  let store = new Storage('prefix');

  return store.setItem('key', 'value')
  .then(() => store.getItem('key'))
  .then(value => {
    assert.equal(value, 'value');
  });
});

exports["test value don't exist before set"] = promiseTest(assert => {
  let store = new Storage('prefix');
  return store.getItem('absent')
  .then(value => assert.equal(value, null));
});

exports['test set and remove and get'] = promiseTest(assert => {
  let store = new Storage('prefix');

  return store.setItem('removed', 'value')
  .then(() => store.removeItem('removed'))
  .then(() => store.getItem('removed'))
  .then(value => assert.equal(value, null));
});

exports['test tests are independent 1'] = promiseTest(assert => {
  let store = new Storage('prefix');
  return store.getItem('counter')
  .then(value => store.setItem('counter', (value || 0) + 1))
  .then(() => store.getItem('counter'))
  .then(value => assert.equal(value, 1));
});

exports['test tests are independent 2'] = promiseTest(assert => {
  let store = new Storage('prefix');
  return store.getItem('counter')
  .then(value => store.setItem('counter', (value || 0) + 1))
  .then(() => store.getItem('counter'))
  .then(value => assert.equal(value, 1));
});

exports['test tests are independent 3'] = promiseTest(assert => {
  let store = new Storage('prefix');
  return store.getItem('counter')
  .then(value => store.setItem('counter', (value || 0) + 1))
  .then(() => store.getItem('counter'))
  .then(value => assert.equal(value, 1));
});

exports['test tests are independent 4'] = promiseTest(assert => {
  let store = new Storage('prefix');
  return store.getItem('counter')
  .then(value => store.setItem('counter', (value || 0) + 1))
  .then(() => store.getItem('counter'))
  .then(value => assert.equal(value, 1));
});

require('sdk/test').run(exports);

const testRunner = require('sdk/test');

const {EventEmitter} = require('../lib/EventEmitter.js');
const {promiseTest} = require('./utils.js');

exports['test it works'] = (assert, done) => {
  let ee = new EventEmitter();
  ee.on('foo', () => done());
  ee.emit('foo');
};

exports['test it fires events async'] = (assert, done) => {
  let ee = new EventEmitter();
  let flag = 0;
  ee.on('foo', () => {
    flag += 1;
    assert.equal(flag, 1);
    done();
  });
  assert.equal(flag, 0);
  ee.emit('foo');
  assert.equal(flag, 0);
};

exports['test it can safely fire events with no listeners'] = assert => {
  let ee = new EventEmitter();
  ee.emit('foo');
};

exports['test it passes arguments'] = (assert, done) => {
  let ee = new EventEmitter();
  ee.on('foo', arg => {
    assert.equal(arg, 'it works');
    done();
  });
  ee.emit('foo', 'it works');
};

exports['test it works with multiple listeners in order'] = (assert, done) => {
  let ee = new EventEmitter();
  let counter = 0;

  ee.on('foo', () => {
    counter += 1;
    assert.equal(counter, 1);
  });

  ee.on('foo', () => {
    counter += 2;
    assert.equal(counter, 3);
    done();
  });

  ee.emit('foo');
};

testRunner.run(exports);

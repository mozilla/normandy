/* eslint-disable no-console */
exports.promiseTest = function(test) {
  return function(assert, done) {
    test(assert)
    .catch(err => {
      console.error(err);
      assert.ok(false, err);
    })
    .then(() => done());
  };
};

exports.Storage = function(prefix) {
  if (prefix === undefined) {
    throw new Error('Storage prefix must be defined');
  }
  this.prefix = prefix;
};

Object.assign(exports.Storage.prototype, {
  key(suffix) {
    return `${this.prefix}.${suffix}`;
  },

  getItem(key) {
    raise new Error('Not implemented');
  },

  setItem(key, value) {
    raise new Error('Not implemented');
  },

  removeItem(key) {
    raise new Error('Not implemented');
  },
});

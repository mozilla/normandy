var {indexedDB} = require('sdk/indexed-db');

const idbPromise = new Promise((resolve, reject) => {
  let request = indexedDB.open('normandy', 1);
  request.onsuccess = event => resolve(event.target.result);
  request.onerror = () => reject();

  request.onupgradeneeded = event => {
    var db = event.target.result;
    db.createObjectStore('storage', {keyPath: 'key'});
  };
});

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

  getItem(keySuffix) {
    return idbPromise.then(db => {
      return new Promise((resolve, reject) => {
        let key = this.key(keySuffix);
        let transaction = db.transaction(['storage'], 'readonly');
        let request = transaction.objectStore('storage').get(key);
        request.onsuccess = event => {
          if (event.target.result) {
            resolve(event.target.result.value);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject();
      });
    });
  },

  setItem(keySuffix, value) {
    return idbPromise.then(db => {
      return new Promise((resolve, reject) => {
        let key = this.key(keySuffix);
        let transaction = db.transaction(['storage'], 'readwrite');
        let request = transaction.objectStore('storage').add({key, value});
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
      });
    });
  },

  removeItem(keySuffix) {
    return idbPromise.then(db => {
      return new Promise((resolve, reject) => {
        let key = this.key(keySuffix);
        let transaction = db.transaction(['storage'], 'readwrite');
        let request = transaction.objectStore('storage').delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
      });
    });
  },
});

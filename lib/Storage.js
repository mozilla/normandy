/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {Cu} = require("chrome");
const {indexedDB} = require("sdk/indexed-db");

exports.makeStorage = function(prefix, sandbox) {
  if (!sandbox) {
    throw new Error("No sandbox passed");
  }

  const idbPromise = new sandbox.Promise((resolve, reject) => {
    let request = indexedDB.open("normandy", 1);
    request.onsuccess = event => resolve(event.target.result);
    request.onerror = err => reject(err);

    request.onupgradeneeded = event => {
      var db = event.target.result;
      db.createObjectStore("storage", {keyPath: "key"});
    };
  });

  function makeKey(suffix) {
    return `${prefix}.${suffix}`;
  }

  const storageInterface = {
    getItem(keySuffix) {
      return idbPromise.then(db => {
        return new sandbox.Promise((resolve, reject) => {
          let key = makeKey(keySuffix);
          let transaction = db.transaction(["storage"], "readonly");
          let request = transaction.objectStore("storage").get(key);
          request.onsuccess = event => {
            if (event.target.result) {
              resolve(event.target.result.value);
            } else {
              resolve(null);
            }
          };
          request.onerror = err => reject(err);
        });
      });
    },

    setItem(keySuffix, value) {
      return idbPromise.then(db => {
        return new sandbox.Promise((resolve, reject) => {
          let key = makeKey(keySuffix);
          let transaction = db.transaction(["storage"], "readwrite");
          let request = transaction.objectStore("storage").put({key, value});
          request.onsuccess = () => resolve();
          request.onerror = err => reject(err);
        });
      });
    },

    removeItem(keySuffix) {
      return idbPromise.then(db => {
        return new sandbox.Promise((resolve, reject) => {
          let key = makeKey(keySuffix);
          let transaction = db.transaction(["storage"], "readwrite");
          let request = transaction.objectStore("storage").delete(key);
          request.onsuccess = () => resolve();
          request.onerror = err => reject(err);
        });
      });
    },

    /**
     * Clears all storage for all recipes.
     * @promise {undefined} returns when the storage is cleared.
     */
    clear() {
      return idbPromise.then(db => {
        return new sandbox.Promise((resolve, reject) => {
          let transaction = db.transaction(["storage"], "readwrite");
          let request = transaction.objectStore("storage").clear();
          request.onsuccess = () => resolve();
          request.onerror = err => reject(err);
        });
      });
    },
  };

  return Cu.cloneInto(storageInterface, sandbox, {
    cloneFunctions: true,
  });
};

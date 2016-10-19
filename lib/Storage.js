/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const {Cu} = require('chrome');
Cu.import('resource://gre/modules/XPCOMUtils.jsm'); /* global XPCOMUtils */

XPCOMUtils.defineLazyModuleGetter(this, 'JSONFile',
                                  'resource://gre/modules/JSONFile.jsm'); /* global JSONFile */

XPCOMUtils.defineLazyModuleGetter(this, 'OS',
                                  'resource://gre/modules/osfile.jsm'); /* global OS */
XPCOMUtils.defineLazyModuleGetter(this, 'Task',
                                  'resource://gre/modules/Task.jsm'); /* global Task */

const {Log} = require('./Log.js');

let storePromise;

function loadStorage() {
  if (storePromise === undefined) {
    let path = OS.Path.join(OS.Constants.Path.profileDir, 'recipe-client.json');
    let storage = new JSONFile({path});
    storePromise = Task.spawn(function* () {
      yield storage.load();
      return storage;
    });
  }
  return storePromise;
}

exports.Storage = function(prefix, sandbox) {
  if (!sandbox) {
    throw new Error('No sandbox passed');
  }

  const storageInterface = {
    /**
     * Sets an item in the prefixed storage.
     * @returns {Promise}
     * @resolves With the stored value, or null.
     * @rejects Javascript exception.
     */
    getItem(keySuffix) {
      return loadStorage()
        .then(store => {
          let namespace = store.data[prefix] || {};
          const value = namespace[keySuffix] || null;
          return sandbox.Promise.resolve(Cu.cloneInto(value, sandbox));
        })
        .catch(err => {
          Log.error(err);
          throw new Error(err.toString());
        });
    },

    /**
     * Sets an item in the prefixed storage.
     * @returns {Promise}
     * @resolves When the operation is completed succesfully
     * @rejects Javascript exception.
     */
    setItem(keySuffix, value) {
      return loadStorage()
        .then(store => {
          if (!(prefix in store.data)) {
            store.data[prefix] = {};
          }
          store.data[prefix][keySuffix] = value;
          return store.save();
        })
        .then(() => {
          return sandbox.Promise.resolve();
        })
        .catch(err => {
          Log.error(err);
          throw new Error(err.toString());
        });
    },

    /**
     * Removes a single item from the prefixed storage.
     * @returns {Promise}
     * @resolves When the operation is completed succesfully
     * @rejects Javascript exception.
     */
    removeItem(keySuffix) {
      return loadStorage()
        .then(store => {
          if (!(prefix in store.data)) {
            return Promise.resolve();
          }
          delete store.data[prefix][keySuffix];
          return store.save();
        })
        .then(() => {
          return sandbox.Promise.resolve();
        })
        .catch(err => {
          Log.error(err);
          throw new Error(err.toString());
        });
    },

    /**
     * Clears all storage for the prefix.
     * @returns {Promise}
     * @resolves When the operation is completed succesfully
     * @rejects Javascript exception.
     */
    clear() {
      return loadStorage()
        .then(store => {
          store.data[prefix] = {};
          return store.save();
        })
        .then(() => {
          return sandbox.Promise.resolve();
        })
        .catch(err => {
          Log.error(err);
          throw new Error(err.toString());
        });
    },
  };

  return Cu.cloneInto(storageInterface, sandbox, {
    cloneFunctions: true,
  });
};

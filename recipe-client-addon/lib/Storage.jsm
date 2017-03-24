/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://shield-recipe-client/lib/LogManager.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "JSONFile", "resource://gre/modules/JSONFile.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "OS", "resource://gre/modules/osfile.jsm");

this.EXPORTED_SYMBOLS = ["Storage"];

const log = LogManager.getLogger("storage");

const STORAGE_DURABILITY_KEY = '_storageDurability';
let storePromise;

function loadStorage() {
  if (storePromise === undefined) {
    const path = OS.Path.join(OS.Constants.Path.profileDir, "shield-recipe-client.json");
    const storage = new JSONFile({path});
    storePromise = (async function () {
      await storage.load();
      return storage;
    })();
  }
  return storePromise;
}

this.Storage = {
  makeStorage(prefix, sandbox) {
    if (!sandbox) {
      throw new Error("No sandbox passed");
    }

    const storageInterface = {
      /**
       * Sets the initial 'durability values' for this store to increase durability
       * confidence in later checks. Should only be called on instantiation.
       *
       * @returns  {Promise}
       * @resolves When the store durability is set successfully.
       * @rejects  Javascript exception.
       */
      seedStoreDurability() {
        return new sandbox.Promise((resolve, reject) =>
          loadStorage()
            .then(store => {
              store.data[prefix] = store.data[prefix] || {};
              store.data[prefix][STORAGE_DURABILITY_KEY] = 0;
              store.saveSoon();
            })
            .catch(err => reject(new sandbox.Error()))
        );
      },

      /**
       * Checks the durability of the current store
       *
       * @returns  {Promise}
       * @resolves When the store durability is set successfully.
       * @rejects  Javascript exception.
       */
      checkStoreDurability(store) {
        store.data[prefix] = store.data[prefix] || {};
        const localStore = store.data[prefix];

        // Determine if the store has an existing durability key, and if so,
        // detect if it is an actual number or not.
        let durability = parseInt(localStore[STORAGE_DURABILITY_KEY], 10);
        const isDurabilityInvalid = isNaN(durability);

        // If `durability` is invalid (doesn't exist, is NaN), there is a problem
        // with the storage's integrity.
        if(isDurabilityInvalid) {
          log.warn('Storage durability unconfirmed');
        } else {
          // If we're still here, set the new durability value into storage.
          store.data[prefix][STORAGE_DURABILITY_KEY] = durability + 1;
          store.saveSoon();
        }

        // Return the store so this method can be chained into promises.
        return store;
      }

      /**
       * Sets an item in the prefixed storage.
       * @returns {Promise}
       * @resolves With the stored value, or null.
       * @rejects Javascript exception.
       */
      getItem(keySuffix) {
        return new sandbox.Promise((resolve, reject) => {
          loadStorage()
            .then(this.checkStoreDurability)
            .then(store => {
              const namespace = store.data[prefix] || {};
              const value = namespace[keySuffix] || null;
              resolve(Cu.cloneInto(value, sandbox));
            })
            .catch(err => {
              log.error(err);
              reject(new sandbox.Error());
            });
        });
      },

      /**
       * Sets an item in the prefixed storage.
       * @returns {Promise}
       * @resolves When the operation is completed succesfully
       * @rejects Javascript exception.
       */
      setItem(keySuffix, value) {
        return new sandbox.Promise((resolve, reject) => {
          loadStorage()
            .then(this.checkStoreDurability)
            .then(store => {
              if (!(prefix in store.data)) {
                store.data[prefix] = {};
              }
              store.data[prefix][keySuffix] = value;
              store.saveSoon();
              resolve();
            })
            .catch(err => {
              log.error(err);
              reject(new sandbox.Error());
            });
        });
      },

      /**
       * Removes a single item from the prefixed storage.
       * @returns {Promise}
       * @resolves When the operation is completed succesfully
       * @rejects Javascript exception.
       */
      removeItem(keySuffix) {
        return new sandbox.Promise((resolve, reject) => {
          loadStorage()
            .then(this.checkStoreDurability)
            .then(store => {
              if (!(prefix in store.data)) {
                return;
              }
              delete store.data[prefix][keySuffix];
              store.saveSoon();
              resolve();
            })
            .catch(err => {
              log.error(err);
              reject(new sandbox.Error());
            });
        });
      },

      /**
       * Clears all storage for the prefix.
       * @returns {Promise}
       * @resolves When the operation is completed succesfully
       * @rejects Javascript exception.
       */
      clear() {
        return new sandbox.Promise((resolve, reject) => {
          return loadStorage()
            .then(this.checkStoreDurability)
            .then(store => {
              store.data[prefix] = {};
              store.saveSoon();
              resolve();
            })
            .catch(err => {
              log.error(err);
              reject(new sandbox.Error());
            });
        });
      },
    };

    // Prepare this store for future durability checks.
    storageInterface.seedStoreDurability();

    return Cu.cloneInto(storageInterface, sandbox, {
      cloneFunctions: true,
    });
  },

  /**
   * Clear ALL storage data and save to the disk.
   */
  clearAllStorage() {
    return loadStorage()
      .then(store => {
        store.data = {};
        store.saveSoon();
      })
      .catch(err => {
        log.error(err);
      });
  },
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This file is meant to run inside action sandboxes

"use strict";


function EventEmitter(driver) { // eslint-disable-line no-unused-vars
  if (!driver) {
    throw new Error("driver must be provided");
  }

  const listeners = {};

  return {
    emit(eventName, event) {
      // Fire events async
      Promise.resolve()
        .then(() => {
          if (!(eventName in listeners)) {
            driver.log(`EventEmitter: Event fired with no listeners: ${eventName}`);
            return;
          }
          let frozenEvent = Object.freeze(event);
          const callbacks = listeners[eventName];
          for (let cb of callbacks) {
            cb(frozenEvent);
          }
        });
    },

    on(eventName, callback) {
      if (!(eventName in listeners)) {
        listeners[eventName] = [];
      }
      listeners[eventName].push(callback);
    },

    off(eventName, callback) {
      if (!(eventName in listeners)) {
        throw new Error("Called off() for event that has no listeners");
      }
      if (eventName in listeners) {
        listeners[eventName] = listeners[eventName].filter(l => l !== callback);
      }
    },

    once(eventName, callback) {
      var hasRun = false;
      this.on(eventName, event => {
        if (hasRun) {
          return;
        }
        hasRun = true;
        callback(event);
        this.off(eventName, callback);
      });
    },
  };
}

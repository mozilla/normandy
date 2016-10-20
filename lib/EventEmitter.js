/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// This is meant to run inside action sandboxes

exports.EventEmitter = function(driver) {
  const listeners = {};

  return {
    emit(eventName, event) {
      // Fire events async
      setTimeout(() => {
        if (!(eventName in listeners)) {
          driver.log(`EventEmitter: Event fired with no listeners: ${eventName}`);
          return;
        }
        let frozenEvent = Object.freeze(event);
        const callbacks = listeners[eventName];
        for (let cb of callbacks) {
          cb(frozenEvent);
        }
      }, 0);
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
      const index = this.listeners[eventName].indexOf(callback);
      if (index !== -1) {
        this.listeners[eventName].splice(index, 1);
      } else {
        throw new Error("Callback for off() not found");
      }
    },

    once(eventName, callback) {
      this.on(eventName, event => {
        callback(event);
        this.off(eventName, callback);
      });
    },
  };
};

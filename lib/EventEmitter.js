const {Cu} = require('chrome');

Cu.import('resource://gre/modules/Timer.jsm'); /* globals setTimeout */

const {Log} = require('./Log.js');

exports.EventEmitter = function(sandbox=null) {
  const listeners = {};

  return {
    emit(eventName, event) {
      // Fire events async
      setTimeout(() => {
        if (!(eventName in listeners)) {
          Log.debug(`EventEmitter: Event fired with no listeners: ${eventName}`);
          return;
        }
        let frozenEvent = Object.freeze(event);
        if (sandbox) {
          frozenEvent = Cu.cloneInto(frozenEvent, sandbox);
        }
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
  };
};

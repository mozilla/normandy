exports.EventEmitter = function() {
  const listeners = {};

  return {
    emit(eventName, event) {
      if (!listeners.has(eventName)) {
        return;
      }
      let frozenEvent = Object.freeze(event);
      const callbacks = listeners.get(eventName);
      for (let cb of callbacks) {
        cb(frozenEvent);
      }
    },

    on(eventName, callback) {
      if (!listeners.has(eventName)) {
        listeners.set(eventName, []);
      }
      listeners.get(eventName).push(callback);
    },
  };
};

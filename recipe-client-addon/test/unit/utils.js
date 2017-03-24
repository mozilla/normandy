"use strict";
/* eslint-disable no-unused-vars */

Cu.import("resource://gre/modules/Preferences.jsm");

function withMockPreferences(testGenerator) {
  return function* inner(...args) {
    const prefManager = new MockPreferences();
    try {
      yield testGenerator(...args, prefManager);
    } finally {
      prefManager.cleanup();
    }
  };
}

class MockPreferences {
  constructor() {
    this.oldValues = {};
  }

  set(name, value) {
    this.preserve(name);
    Preferences.set(name, value);
  }

  preserve(name) {
    if (!(name in this.oldValues)) {
      this.oldValues[name] = Preferences.get(name, undefined);
    }
  }

  cleanup() {
    for (const [name, value] of Object.entries(this.oldValues)) {
      if (value !== undefined) {
        Preferences.set(name, value);
      } else {
        Preferences.reset(name);
      }
    }
  }
}

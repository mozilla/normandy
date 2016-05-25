/* globals Preferences: false */
const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Preferences.jsm');
const {Log} = require('./Log.js');

exports.SelfRepairInteraction = {
  enableSelfRepair() {
    if (!Preferences.get('browser.selfsupport.enabled', true)) {
      Log.info('Reenabling Self Repair');
      this.setSelfRepair(true);
    }
  },

  disableSelfRepair() {
    if (Preferences.get('browser.selfsupport.enabled', true)) {
      Log.info('Disabling Self Repair');
      this.setSelfRepair(false);
    }
  },

  setSelfRepair(enabled) {
    Preferences.set('browser.selfsupport.enabled', enabled);
  },
};

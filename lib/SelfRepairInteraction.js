/* globals Preferences: false */
const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Preferences.jsm');
const {Log} = require('./Log.js');

PREF_SELF_SUPPORT_ENABLED = 'browser.selfsupport.enabled';

exports.SelfRepairInteraction = {
  enableSelfRepair() {
    if (!this.isEnabled()) {
      Log.info('Reenabling Self Repair');
      this.setSelfRepair(true);
    }
  },

  disableSelfRepair() {
    if (this.isEnabled()) {
      Log.info('Disabling Self Repair');
      this.setSelfRepair(false);
    }
  },

  setSelfRepair(enabled) {
    Preferences.set(PREF_SELF_SUPPORT_ENABLED, enabled);
  },

  isEnabled() {
    let enabled = Preferences.get(PREF_SELF_SUPPORT_ENABLED);
    Log.debug('SelfRepairInteraction.isEnabled() ->', enabled);
    return enabled === true || enabled === undefined;
  },
};

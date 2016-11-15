/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {Cu} = require("chrome");
const {prefs} = require("sdk/simple-prefs");
Cu.import("resource://shield-recipe-client/lib/Log.jsm");
Cu.import("resource://shield-recipe-client/lib/RecipeRunner.jsm");
Cu.import("resource://shield-recipe-client/lib/SelfRepairInteraction.jsm");
Cu.import("resource://shield-recipe-client/lib/CleanupManager.jsm");

/* Called when the addon is loaded. This includes browser startup, addon
 * installation, and addon re-enabling. */
exports.main = function() {

  // Self Repair only checks its pref on start, so if we disable it, wait until
  // next startup to run, unless the dev_mode preference is set.
  if (SelfRepairInteraction.isEnabled()) {
    if (prefs.dev_mode) {
      SelfRepairInteraction.disableSelfRepair();
      RecipeRunner.init();
    } else {
      SelfRepairInteraction.disableSelfRepair();
      Log.info("Waiting until next startup to start recipe client. Set Developer Mode to prevent this behavior");
    }
  } else {
    RecipeRunner.init();
  }
};

// Called when Firefox is shut down, or when the addon is uninstalled or disabled.
exports.onUnload = function(reason) {
  CleanupManager.cleanup();

  if (reason === "uninstall" || reason === "disable") {
    SelfRepairInteraction.enableSelfRepair();
  }
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/Log.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "LogManager",
  "resource://shield-recipe-client/lib/LogManager.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "ShieldRecipeClient",
  "resource://shield-recipe-client/lib/ShieldRecipeClient.jsm");

const DEFAULT_PREFS = {
  "extensions.shield-recipe-client.api_url": ["char", "https://normandy.cdn.mozilla.net/api/v1"],
  "extensions.shield-recipe-client.dev_mode": ["bool", false],
  "extensions.shield-recipe-client.enabled": ["bool", true],
  "extensions.shield-recipe-client.startup_delay_seconds": ["int", 300],
  "extensions.shield-recipe-client.logging.level": ["int", Log.Level.Warn],
  "extensions.shield-recipe-client.user_id": ["char", ""],
  "extensions.shield-recipe-client.run_interval_seconds": ["int", 86400], // 24 hours
  "extensions.shield-recipe-client.first_run": ["bool", true],
  "extensions.shield-recipe-client.shieldLearnMoreUrl": [
    "char", "https://support.mozilla.org/1/firefox/%VERSION%/%OS%/%LOCALE%/shield",
  ],
};

this.install = function() {};

this.startup = function() {
  // Initialize preference defaults before anything else happens.
  const prefBranch = Services.prefs.getDefaultBranch("");
  for (const [name, [type, value]] of Object.entries(DEFAULT_PREFS)) {
    switch (type) {
      case "char":
        prefBranch.setCharPref(name, value);
        break;
      case "int":
        prefBranch.setIntPref(name, value);
        break;
      case "bool":
        prefBranch.setBoolPref(name, value);
        break;
      default:
        throw new Error(`Invalid default preference type ${type}`);
    }
  }

  ShieldRecipeClient.startup();
};

this.shutdown = function(data, reason) {
  ShieldRecipeClient.shutdown(reason);

  // Unload add-on modules. We don't do this in ShieldRecipeClient so that
  // modules are not unloaded accidentally during tests.
  const log = LogManager.getLogger("bootstrap");
  let modules = [
    "lib/ActionSandboxManager.jsm",
    "lib/Addons.jsm",
    "lib/AddonStudies.jsm",
    "lib/CleanupManager.jsm",
    "lib/ClientEnvironment.jsm",
    "lib/FilterExpressions.jsm",
    "lib/EventEmitter.jsm",
    "lib/Heartbeat.jsm",
    "lib/LogManager.jsm",
    "lib/NormandyApi.jsm",
    "lib/NormandyDriver.jsm",
    "lib/PreferenceExperiments.jsm",
    "lib/RecipeRunner.jsm",
    "lib/Sampling.jsm",
    "lib/SandboxManager.jsm",
    "lib/ShieldRecipeClient.jsm",
    "lib/Storage.jsm",
    "lib/Uptake.jsm",
    "lib/Utils.jsm",
  ].map(m => `resource://shield-recipe-client/${m}`);
  modules = modules.concat([
    "AboutPages.jsm",
  ].map(m => `resource://shield-recipe-client-content/${m}`));
  modules = modules.concat([
    "ajv.js",
    "mozjexl.js",
  ].map(m => `resource://shield-recipe-client-vendor/${m}`));

  for (const module of modules) {
    log.debug(`Unloading ${module}`);
    Cu.unload(module);
  }
};

this.uninstall = function() {};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "LogManager",
  "resource://shield-recipe-client/lib/LogManager.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "ShieldRecipeClient",
  "resource://shield-recipe-client/lib/ShieldRecipeClient.jsm");

this.install = function() {};

this.startup = async function() {
  await ShieldRecipeClient.startup();
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
    "lib/StudyStorage.jsm",
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

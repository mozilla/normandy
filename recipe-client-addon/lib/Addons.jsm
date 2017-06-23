/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "AddonManager", "resource://gre/modules/AddonManager.jsm");

this.EXPORTED_SYMBOLS = ["Addons"];

/**
 * SafeAddons store info about an add-on. They are single-depth
 * objects to simplify cloning, and have no methods so they are safe
 * to pass to sandboxes and filter expressions.
 *
 * @typedef {Object} SafeAddon
 * @property {string} id
 *   Add-on id, such as "shield-recipe-client@mozilla.com" or "{4ea51ac2-adf2-4af8-a69d-17b48c558a12}"
 * @property {Date} installDate
 * @property {boolean} isActive
 * @property {string} name
 * @property {string} type
 *   "extension", "theme", etc.
 * @property {string} version
 */

this.Addons = {
  /**
   * Get information about an installed add-on by ID.
   *
   * @param {string} addonId
   * @returns {SafeAddon?} Add-on with given ID, or null if not found.
   */
  get: async function get(addonId) {
    const addon = await AddonManager.getAddonByID(addonId);
    if (!addon) {
      return null;
    }
    return Addons.serializeForSandbox(addon);
  },

  /**
   * Get information about all installed add-ons.
   * @async
   * @returns {Array<SafeAddon>}
   */
  getAll: async function get(addonId) {
    const addons = await AddonManager.getAllAddons();
    return addons.map(Addons.serializeForSandbox);
  },

  /**
   * Installs an add-on
   * @prop installUrl {string} Url to download the .xpi for the add-on from.
   * @async
   * @returns {string} Add-on ID that was installed
   * @throws {string} If the add-on can not be installed.
   */
  install: async function install(installUrl) {
    const installObj = await AddonManager.getInstallForURL(installUrl, null, "application/x-xpinstall");
    const result = new Promise((resolve, reject) => installObj.addListener({
      onInstallEnded(addonInstall, addon) {
        resolve(addon.id);
      },
      onInstallFailed(addonInstall) {
        reject(`AddonInstall error code: [${addonInstall.error}]`);
      },
      onDownloadFailed() {
        reject(`Download failed: [${installUrl}]`);
      },
    }));
    installObj.install();
    return result;
  },

  /**
   * Uninstalls an add-on by ID.
   * @prop addonId {string} Add-on ID to uninstall.
   * @async
   * @throws If no add-on with `addonId` is installed.
   */
  uninstall: async function uninstall(addonId) {
    const addon = await AddonManager.getAddonByID(addonId);
    if (addon === null) {
      throw new Error(`No addon with ID [${addonId}] found.`);
    }
    addon.uninstall();
    return null;
  },

  /**
   * Make a safe serialization of an add-on
   * @param addon {Object} An add-on object as returned from AddonManager.
   */
  serializeForSandbox(addon) {
    return {
      id: addon.id,
      installDate: new Date(addon.installDate),
      isActive: addon.isActive,
      name: addon.name,
      type: addon.type,
      version: addon.version,
    };
  },
};

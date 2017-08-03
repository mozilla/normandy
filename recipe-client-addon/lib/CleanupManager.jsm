/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "AsyncShutdown", "resource://gre/modules/AsyncShutdown.jsm");

this.EXPORTED_SYMBOLS = ["CleanupManager"];

let cleanupPromise = null;
const cleanupHandlers = new Set();

this.CleanupManager = {
  addCleanupHandler(handler) {
    cleanupHandlers.add(handler);
  },

  removeCleanupHandler(handler) {
    cleanupHandlers.delete(handler);
  },

  async cleanup() {
    if (cleanupPromise === null) {
      cleanupPromise = (async () => {
        for (const handler of cleanupHandlers) {
          try {
            await handler();
          } catch (ex) {
            // TODO: Log error in a way that persists after shutdown
            Cu.reportError(ex);
          }
        }
      })();

      // Block shutdown to ensure any cleanup tasks that write data are
      // finished.
      AsyncShutdown.profileBeforeChange.addBlocker(
        "ShieldRecipeClient: Cleaning up",
        cleanupPromise,
      );
    }

    return cleanupPromise;
  },
};

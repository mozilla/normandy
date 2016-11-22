/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/Preferences.jsm");
Cu.import("resource://shield-recipe-client/lib/Log.jsm");

this.EXPORTED_SYMBOLS = ["SelfRepairInteraction"];

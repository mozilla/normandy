/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Module of shared error subclasses used within the recipe client add-on.
 */

"use strict";

this.EXPORTED_SYMBOLS = ["InvalidSignatureError"];

class InvalidSignatureError extends Error {}

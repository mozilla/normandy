/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {Cu} = require('chrome');
Cu.import('resource://gre/modules/Console.jsm'); /* globals ConsoleAPI */

const LOG_LEVEL_PREF = 'extensions.recipeclient.log_level';

exports.Log = new ConsoleAPI({
  prefix: 'RecipeRunner',
  maxLogLevelPref: LOG_LEVEL_PREF,
});

/**
 * Make a namespaced version of this logger which will prepend a string
 * to all messages.
 * @param  {String} namespace The string to prepend to messages. A colon
 *                            and a space will be added to the end.
 * @return {Object} A namespaced logger.
 */
exports.Log.makeNamespace = function(namespace) {
  return new ConsoleAPI({
    prefix: 'RecipeRunner.' + namespace,
    maxLogLevelPref: LOG_LEVEL_PREF,
  });
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

this.EXPORTED_SYMBOLS = ["Utils"];

this.Utils = {
  /**
   * Convert an array of objects to an object. Each item is keyed by the value
   * of the given key on the item.
   *
   * > list = [{foo: "bar"}, {foo: "baz"}]
   * > keyBy(list, "foo") == {bar: {foo: "bar"}, baz: {foo: "baz"}}
   *
   * @param  {Array} list
   * @param  {String} key
   * @return {Object}
   */
  keyBy(list, key) {
    return list.reduce((map, item) => {
      if (!(key in item)) {
        throw new Error(`List item was missing key "${key}".`);
      }

      map[item[key]] = item;
      return map;
    }, {});
  },
};

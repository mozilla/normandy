/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://shield-recipe-client/lib/Sampling.jsm");
Cu.import("resource://shield-recipe-client/lib/PreferenceFilters.jsm");

this.EXPORTED_SYMBOLS = ["FilterExpressions"];

XPCOMUtils.defineLazyGetter(this, "nodeRequire", () => {
  const {Loader, Require} = Cu.import("resource://gre/modules/commonjs/toolkit/loader.js", {});
  const loader = new Loader({
    paths: {
      "": "resource://shield-recipe-client/node_modules/",
    },
  });
  return new Require(loader, {});
});

XPCOMUtils.defineLazyGetter(this, "jexl", () => {
  const {Jexl} = nodeRequire("mozjexl/lib/Jexl.js");
  const jexl = new Jexl();
  jexl.addTransforms({
    date: dateString => new Date(dateString),
    stableSample: Sampling.stableSample,
    bucketSample: Sampling.bucketSample,
    preferenceValue: PreferenceFilters.preferenceValue,
    preferenceIsUserSet: PreferenceFilters.preferenceIsUserSet,
    preferenceExists: PreferenceFilters.preferenceExists,
    keys,
  });
  jexl.addBinaryOp("intersect", 40, operatorIntersect);
  return jexl;
});

this.FilterExpressions = {
  eval(expr, context = {}) {
    const onelineExpr = expr.replace(/[\t\n\r]/g, " ");
    return jexl.eval(onelineExpr, context);
  },
};

/**
 * Return an array of the given object's own keys (specifically, its enumerable
 * properties).
 * @param {Object} obj
 * @return {Array[String]}
 */
function keys(obj) {
  return Object.keys(obj);
}

/**
 * Find all the values that are present in both lists.
 * @param {Array} listA
 * @param {Array} listB
 * @return {Array}
 */
function operatorIntersect(listA, listB) {
  return listA.filter(item => listB.includes(item));
}

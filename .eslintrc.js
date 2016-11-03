"use strict";

module.exports = {
  extends: "normandy",

  plugins: [
    "mozilla",
  ],

  rules: {
    "no-else-return": 2,
    "computed-property-spacing": 2,
    "indent": [1, 2, {SwitchCase: 1}],
    "mozilla/no-aArgs": 1,
    "mozilla/this-top-level-scope": 1,
    "no-console": 1,
    "quotes": [1, "double", {avoidEscape: true}],
    "mozilla/balanced-listeners": 0,
  },

  globals: {
    require: false,
    exports: true,
    uneval: false,
    crypto: true,
    TextEncoder: true,
  },
};

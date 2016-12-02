"use strict";

module.exports = {
  extends: "normandy",

  plugins: [
    "mozilla",
  ],

  rules: {
    "computed-property-spacing": 2,
    "indent": [1, 2, {SwitchCase: 1}],
    "mozilla/balanced-listeners": 0,
    "mozilla/no-aArgs": 1,
    "mozilla/import-globals": 2,
    "no-console": 1,
    "no-else-return": 2,
    "quotes": [1, "double", {avoidEscape: true}],
    "babel/new-cap": [0],
    "prefer-const": [1],
  },

  globals: {
    Components: false,
    crypto: true,
    exports: true,
    fetch: false,
    require: false,
    TextEncoder: true,
    uneval: false,
  },
};

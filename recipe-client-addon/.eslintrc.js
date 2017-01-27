"use strict";

module.exports = {
  extends: "normandy",

  plugins: [
    "mozilla",
  ],

  rules: {
    "computed-property-spacing": 2,
    "space-infix-ops": [2],
    "no-else-return": 2,
    "mozilla/import-globals": 2,
    "spaced-comment": 2,
    "space-before-function-paren": [2, "never"],
    "object-shorthand": [2],
    "prefer-const": 1,
    "indent": [1, 2, {SwitchCase: 1}],
    "mozilla/no-aArgs": 1,
    "no-console": 1,
    "quotes": [1, "double", {avoidEscape: true}],
    "babel/new-cap": 0,
    "mozilla/balanced-listeners": 0,
  },

  globals: {
    Components: false,
    crypto: true,
    exports: true,
    global: false,
    require: false,
    TextEncoder: true,
    uneval: false,
  },
};

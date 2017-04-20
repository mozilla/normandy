"use strict";

module.exports = {
  extends: "eslint:recommended",

  plugins: [
    "mozilla",
  ],

  rules: {
    "consistent-return": 2,
    "eqeqeq": 2,
    "semi": [2, "always"],
    "comma-dangle": [2, "always-multiline"],
    "no-unused-vars": [2],
    "computed-property-spacing": 2,
    "space-infix-ops": [2],
    "no-else-return": 2,
    "mozilla/import-globals": 2,
    "spaced-comment": 2,
    "space-before-function-paren": [2, "never"],
    "object-shorthand": [2],
    "no-shadow": [2],
    "prefer-const": 1,
    "indent": [1, 2, {SwitchCase: 1}],
    "mozilla/no-aArgs": 1,
    "no-console": 1,
    "quotes": [1, "double", {avoidEscape: true}],
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

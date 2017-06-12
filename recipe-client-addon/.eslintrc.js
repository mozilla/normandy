"use strict";

module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:mozilla/recommended",
  ],

  plugins: [
    "mozilla",
  ],

  rules: {
    "babel/new-cap": "off",
    "comma-dangle": ["error", "always-multiline"],
    "eqeqeq": "error",
    "indent": ["warn", 2, {SwitchCase: 1}],
    "mozilla/no-aArgs": "warn",
    "mozilla/balanced-listeners": 0,
    "no-console": "warn",
    "no-shadow": ["error"],
    "no-unused-vars": "error",
    "prefer-const": "warn",
    "semi": ["error", "always"],
  },
};

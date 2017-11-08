"use strict";

module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:mozilla/recommended",
    "plugin:react/recommended",
  ],

  plugins: [
    "mozilla",
    "react",
  ],

  rules: {
    "babel/new-cap": "off",
    "comma-dangle": ["error", "always-multiline"],
    "eqeqeq": "error",
    "indent-legacy": ["warn", 2, {SwitchCase: 1}],
    "mozilla/no-aArgs": "warn",
    "mozilla/balanced-listeners": 0,
    "mozilla/use-services": "error",
    "no-console": "warn",
    "no-shadow": ["error"],
    "no-unused-vars": "error",
    "prefer-const": "warn",
    "semi": ["error", "always"],
    "no-return-await": ["error"],
    "dot-notation": ["error"],
  },
};

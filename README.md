<h1>Normandy</h1>

***Normandy is a collection of projects that provide a fast and accurate way to
interact with unbiased subsets of Firefox users.***

<hr/>

***This repo is a *monorepo*. It contains several projects, each represented by a
top level directory:***

*
* recipe-server - Django server that manages and delivers recipes
  efficiently and securely.
* recipe-client-addon - Firefox system add-on to fetch, verify, and execute
  recipes.
* lints - Shared tools and configs for linting. (Each project may have separate
  configs as well)
* compose - Scripts and configurations to create multi-server environments for
  development and testing.
* mozjexl - A safe expression evaluation library. A fork of [Jexl][].
*

[![CircleCI](https://img.shields.io/circleci/project/mozilla/normandy/master.svg?maxAge=2592000&label=CI)](https://circleci.com/gh/mozilla/normandy/tree/master)
[![Requires.io](https://img.shields.io/requires/github/mozilla/normandy.svg?maxAge=2592000&label=PyPI)](https://requires.io/github/mozilla/normandy/requirements/?branch=master)
[![David](https://img.shields.io/david/mozilla/normandy.svg?maxAge=2592000&label=NPM)](https://david-dm.org/mozilla/normandy)

[Recipe Server]: https://wiki.mozilla.org/Firefox/Recipe_Server

<hr/>

<h1>Documentation</h1>

***Developer documentation for the service can be found at http://normandy.readthedocs.org/.***

<hr/>

<h1>License</h1>

***Normandy is licensed under the MPLv2. See the `LICENSE` file for details.***

<hr/>

# Recipe Client [![CircleCI](https://img.shields.io/circleci/project/mozilla/normandy-addon.svg)](https://circleci.com/gh/mozilla/normandy-addon/tree/master)

Client to download and run recipes from [Normandy](https://github.com/mozilla/normandy).

# Development

To install requirements:

```bash
$ npm install
```

To build the addon:

```bash
$ npm run build
```

This will create `recipe-client.xpi`, which you can install in Firefox.

For hacking on the addon, consider using [`jpm post`][].

[`jpm post`]: https://www.npmjs.com/package/jpm#using-post-and-watchpost

# Normandy

The preference `extensions.recipeclient.api_url` is read to contact a Normandy
server. There is no default yet. It should be set to something like
`https://localhost:8443/api/v1/`.

The easiest way to run a Normandy server locally is using [normandy-compose][].

[normandy-compose]: https://github.com/mozilla/normandy-compose

# Bugs

Bugs can be field in [the Normandy product on Bugzilla][normandy-bugs].

[normandy-bugs]: https://bugzilla.mozilla.org/buglist.cgi?quicksearch=product%3ANormandy

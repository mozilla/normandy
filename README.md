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
This uses a development mode key for signing, which has a root hash of 

```
4C:35:B1:C3:E3:12:D9:55:E7:78:ED:D0:A7:E7:8A:38:83:04:EF:01:BF:FA:03:29:B2:46:9F:3C:C5:EC:36:04
```

Set the pref `security.content.signature.root_hash` to this value to mark the
key used by the normandy-compose server as trusted.

[normandy-compose]: https://github.com/mozilla/normandy-compose

# Bugs

Bugs can be field in [the Normandy product on Bugzilla][normandy-bugs].

[normandy-bugs]: https://bugzilla.mozilla.org/buglist.cgi?quicksearch=product%3ANormandy

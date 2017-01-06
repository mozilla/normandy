# Recipe Client

Client to download and run recipes from [Normandy Recipe Server][server].

[server](https://github.com/mozilla/normandy)

# Development

Currently this add-on is only designed to run in the context of a system
add-on. That means you need a full checkout of mozilla-central, and must build
Firefox. This will change soon.

To install requirements:

```bash
$ npm install
```

To build the add-on into mozilla-central

```bash
$ ./bin/update-mozilla-central.sh path/to/mozilla-central
```

This will populate `browser/extensions/shield-recipe-client`.

# Preferences

The preference `extensions.shield-recipe-client.api_url` is read to contact a
recipe server. The default is the production instance. It can be changed for
local development or testing. It must be a HTTPS url.

The easiest way to run a Normandy server locally is using [compose][].
This uses a development mode key for signing, which has a root hash of

```
4C:35:B1:C3:E3:12:D9:55:E7:78:ED:D0:A7:E7:8A:38:83:04:EF:01:BF:FA:03:29:B2:46:9F:3C:C5:EC:36:04
```

Set the pref `security.content.signature.root_hash` to this value to mark the
key used by the normandy-compose server as trusted.

[compose]: https://github.com/mozilla/normandy/tree/master/compose

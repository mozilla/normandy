# Recipe Client

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

This will create `@recipe-client-0.0.1.xpi`, which you can install in Firefox.

For hacking on the addon, consider using `jpm post` as described [here][jpm post].

[jpm post]: https://www.npmjs.com/package/jpm#using-post-and-watchpost

# Bugs

Bugs can be field in [the SHIELD component on Bugzilla][shield].

[shield]: https://bugzilla.mozilla.org/buglist.cgi?quicksearch=component%3Ashield

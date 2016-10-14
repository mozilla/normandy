#!/usr/bin/env bash

set -eu

if [[ $# -lt 1 ]]; then
  echo "usage: $(basename $0) DEST" >&2
  exit 1
fi

BASE_DIR="$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )")"
dest=$1

echo "Building XPI"
npm run build > /dev/null
echo "Clearing destination"
rm -rf "${dest}"/*
echo "Extracting XPI"
unzip -quo "shield-recipe-client.xpi" -d "${dest}" > /dev/null

### Adapt built addon to mozilla-central

echo "Fixups:"

echo "* Removing README and LICENSE"
rm "${dest}/README.md"
rm "${dest}/LICENSE"

echo "Creating moz.build"
echo "
# -*- Mode: python; indent-tabs-mode: nil; tab-width: 40 -*-
# vim: set filetype=python:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

DEFINES['MOZ_APP_VERSION'] = CONFIG['MOZ_APP_VERSION']
DEFINES['MOZ_APP_MAXVERSION'] = CONFIG['MOZ_APP_MAXVERSION']

FINAL_TARGET_FILES.features['shield-recipe-client@mozilla.org'] += [
  'bootstrap.js',
  'index.js',
  'install.rdf',
  'lib',
  'node_modules',
  'package.json',
]" > "${dest}/moz.build"

echo "Patching install.rdf"
sed -i \
    -e '/<em:creator>/d' \
    -e '/<em:optionsURL>/d' \
    -e '/<em:optionsType>/d' \
    "${dest}/install.rdf"

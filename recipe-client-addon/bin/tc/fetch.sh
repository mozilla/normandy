#!/usr/bin/env bash
set -eu

# Creates gecko-dev-master
echo 'Downloading mozilla-central...'
hg clone http://hg.mozilla.org/mozilla-central/

echo 'Pulling tags from mozilla/normandy repo on Github...'
pushd normandy
git remote add mozilla https://github.com/mozilla/normandy.git
git fetch mozilla
popd

echo 'Syncing recipe-client-addon to mozilla-central...'
pushd normandy/recipe-client-addon
npm install
./bin/update-mozilla-central.sh ../../mozilla-central/
popd

echo 'Making build tarball artifact'
tar czf /artifacts/source.tar.gz mozilla-central

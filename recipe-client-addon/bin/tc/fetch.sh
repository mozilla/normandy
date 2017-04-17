#!/usr/bin/env bash
set -eu

# Creates gecko-dev-master
echo 'Downloading gecko-dev...'
curl --location --fail --silent --show-error https://github.com/mozilla/gecko-dev/archive/master.tar.gz | tar xz

echo 'Pulling tags from mozilla/normandy repo on Github...'
pushd normandy
git remote add mozilla https://github.com/mozilla/normandy.git
git fetch mozilla
popd

echo 'Syncing recipe-client-addon to gecko-dev...'
pushd normandy/recipe-client-addon
npm install
./bin/update-mozilla-central.sh ../../gecko-dev-master/
popd

echo 'Making build tarball artifact'
tar czf /artifacts/source.tar.gz gecko-dev-master

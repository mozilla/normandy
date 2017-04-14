#!/usr/bin/env bash
set -eu

# mach wants this
export SHELL=$(which bash)

# Creates gecko-dev-master
echo 'Downloading gecko-dev...'
curl --location --fail --silent --show-error https://github.com/mozilla/gecko-dev/archive/master.tar.gz | tar xz

echo 'Syncing recipe-client-addon to gecko-dev...'
pushd normandy/recipe-client-addon
npm install
./bin/update-mozilla-central.sh ../../gecko-dev-master/
popd

echo 'Making build tarball artifact'
tar czvf /artifacts/source.tar.gz gecko-dev-master

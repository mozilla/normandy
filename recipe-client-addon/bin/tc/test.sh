#!/usr/bin/env bash
set -eu

# mach wants this
export SHELL=$(which bash)

# Creates gecko-dev-master
echo 'Downloading gecko-dev...'
curl -sL https://github.com/mozilla/gecko-dev/archive/master.tar.gz | tar xz

pushd normandy/recipe-client-addon
npm install
./bin/update-mozilla-central.sh ../gecko-dev/
popd

pushd gecko-dev-master
python2.7 ./python/mozboot/bin/bootstrap.py --no-interactive --application-choice=browser
source /root/.cargo/env
./mach lint browser/extensions/shield-recipe-client/
./mach build
xvfb-run ./mach test browser/extensions/shield-recipe-client/
popd

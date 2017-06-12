#!/usr/bin/env bash
set -eu

# mach wants this
export SHELL=$(which bash)

# Creates mozilla-central
echo 'Downloading mozilla-central...'
hg robustcheckout http://hg.mozilla.org/mozilla-central/ mozilla-central --branch default

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

echo 'Setting up environment'
pushd mozilla-central
source /root/.cargo/env
python2.7 ./python/mozboot/bin/bootstrap.py --no-interactive --application-choice=browser_artifact_mode
source /root/.cargo/env

echo 'Running lints'
./mach lint browser/extensions/shield-recipe-client/
popd

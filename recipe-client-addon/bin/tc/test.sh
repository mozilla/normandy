#!/usr/bin/env bash
set -eu

# mach wants this
export SHELL=$(which bash)

# Fetches build results, and creates ./gecko-dev-master/
echo 'Downloading build result'
curl -sfL "$BUILD_RESULT" | tar xz

echo 'Setting up environment'
pushd gecko-dev-master
source /root/.cargo/env
python2.7 ./python/mozboot/bin/bootstrap.py --no-interactive --application-choice=browser
source /root/.cargo/env

echo 'Running lints'
./mach lint browser/extensions/shield-recipe-client/

echo 'Running tests'
xvfb-run ./mach test browser/extensions/shield-recipe-client/
popd

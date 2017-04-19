#!/usr/bin/env bash
set -eu

# mach wants this
export SHELL=$(which bash)

# Fetches source code from fetch task, and creates ./gecko-dev-master/
echo 'Downloading fetch result'
curl --location --fail --silent --show-error "$FETCH_RESULT" | tar xz

echo 'Setting up environment'
pushd gecko-dev-master
source /root/.cargo/env
python2.7 ./python/mozboot/bin/bootstrap.py --no-interactive --application-choice=browser
source /root/.cargo/env

echo 'Running lints'
./mach lint browser/extensions/shield-recipe-client/

popd

#!/usr/bin/env bash
set -eu

# mach wants this
export SHELL=$(which bash)

# Fetches build results, and creates ./mozilla-central/
echo 'Downloading build result'
curl --location --fail --silent --show-error "$BUILD_RESULT" | tar xz

echo 'Setting up environment'
pushd mozilla-central
source /root/.cargo/env
python2.7 ./python/mozboot/bin/bootstrap.py --no-interactive --application-choice=browser_artifact_mode
source /root/.cargo/env

echo 'Running tests'
xvfb-run ./mach test browser/extensions/shield-recipe-client/
popd

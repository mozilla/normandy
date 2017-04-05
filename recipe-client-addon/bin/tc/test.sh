#!/usr/bin/env bash
set -eu

# mach wants this
export SHELL=$(which bash)

# creates gecko-dev-master
echo 'Downloading build result'
curl -sfL "$BUILD_RESULT" | tar xz

pushd gecko-dev-master
source /root/.cargo/env
python2.7 ./python/mozboot/bin/bootstrap.py --no-interactive --application-choice=browser
source /root/.cargo/env
./mach lint browser/extensions/shield-recipe-client/
xvfb-run ./mach test browser/extensions/shield-recipe-client/
popd

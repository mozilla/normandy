#!/usr/bin/env bash
set -eu

# mach wants this
export SHELL=$(which bash)

# Creates gecko-dev-master
echo 'Downloading gecko-dev...'
curl -sfL https://github.com/mozilla/gecko-dev/archive/master.tar.gz | tar xz

echo 'Fetching Normandy'
pushd normandy/recipe-client-addon
npm install
./bin/update-mozilla-central.sh ../gecko-dev/
popd

echo 'Setting up environment'
pushd gecko-dev-master
source /root/.cargo/env
python2.7 ./python/mozboot/bin/bootstrap.py --no-interactive --application-choice=browser
source /root/.cargo/env

echo 'Building Firefox'
./mach build
popd

echo 'Making build tarball artifact'
tar czvf /artifacts/build.tar.gz gecko-dev-master

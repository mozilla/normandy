#!/usr/bin/env bash
set -eu

# mach wants this
export SHELL=$(which bash)

# Fetches source code from fetch task, and creates ./mozilla-central/
echo 'Downloading fetch result'
curl --location --fail --silent --show-error "$FETCH_RESULT" | tar xz

echo 'Setting up environment'
pushd mozilla-central
source /root/.cargo/env
python2.7 ./python/mozboot/bin/bootstrap.py --no-interactive --application-choice=browser
source /root/.cargo/env

echo 'Building Firefox'
echo 'ac_add_options --enable-artifact-builds' > ./mozconfig
./mach build
popd

echo 'Making build tarball artifact'
tar czf /artifacts/build.tar.gz mozilla-central

#!/usr/bin/env bash
set -eu

apt-get install -y npm zip

pushd normandy/recipe-client-addon
npm install
./bin/make-xpi.sh
cp shield-recipe-client.xpi /artifacts/
popd

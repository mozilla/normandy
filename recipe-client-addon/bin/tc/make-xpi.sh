#!/usr/bin/env bash
set -eu

pushd normandy/recipe-client-addon
echo 'NPM install'
npm install

echo 'Making XPI'
./bin/make-xpi.sh --build-vendor
cp shield-recipe-client.xpi /artifacts/
popd

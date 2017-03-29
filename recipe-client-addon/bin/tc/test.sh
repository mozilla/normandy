#!/usr/bin/env bash
set -eu

# mach wants this
export SHELL=$(which bash)

apt-get install -y apt-transport-https curl
curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -
echo 'deb https://deb.nodesource.com/node_6.x yakkety main' > /etc/apt/sources.list.d/nodesource.list
echo 'deb-src https://deb.nodesource.com/node_6.x yakkety main' >> /etc/apt/sources.list.d/nodesource.list
apt-get update

# libgl1-mesa-dev works around a webrender build issue
apt-get install -y curl python2.7 xvfb nodejs libgl1-mesa-dev

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

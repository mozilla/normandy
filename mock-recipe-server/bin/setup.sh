#!/usr/bin/env bash
set -eu

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../.. && pwd)"

# Setup recipe-server container
echo "Initializing mock server containers"
pushd "$REPO_DIR/compose"
./bin/genkeys.sh
docker-compose -p mockrecipeserver run normandy ./manage.py migrate
docker-compose -p mockrecipeserver run normandy ./manage.py update_actions
popd

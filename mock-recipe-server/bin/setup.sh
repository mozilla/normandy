#!/usr/bin/env bash
set -eu

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../.. && pwd)"
WAIT_FOR_DB="./bin/wait-for-it.sh database:5432 --"

compose () {
    docker-compose \
        -p mockrecipeserver \
        -f "$REPO_DIR/compose/docker-compose.yml" \
        $@
}

# Shut down docker even if we error out.
function finish {
    compose stop
}
trap finish EXIT

# Setup recipe-server container
echo "Initializing mock server containers"
pushd "$REPO_DIR/compose"
./bin/genkeys.sh
compose run normandy $WAIT_FOR_DB ./manage.py migrate
compose run normandy ./manage.py update_actions
compose run normandy ./manage.py update_product_details
compose run normandy ./manage.py initial_data
popd

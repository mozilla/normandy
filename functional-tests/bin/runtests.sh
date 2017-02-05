#!/usr/bin/env bash
set -eu

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../.. && pwd)"

compose () {
    docker-compose \
        -p functionaltests \
        -f "$REPO_DIR/compose/docker-compose.yml" \
        -f "$REPO_DIR/functional-tests/docker-compose.yml" \
        $@
}

# Shut down docker even if we error out.
function finish {
    compose stop
}
trap finish EXIT

# Run tests
echo "Running functional tests"
compose run functionaltestrunner ./bin/wait-for-it.sh normandy:8000
compose run functionaltestrunner

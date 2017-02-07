#!/usr/bin/env bash
set -eu

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../.. && pwd)"

compose () {
    docker-compose \
        -p functionaltests \
        -f "$REPO_DIR/compose/docker-compose.yml" \
        -f "$REPO_DIR/functional_tests/docker-compose.yml" \
        $@
}

# Shut down docker even if we error out.
function finish {
    compose stop
}
trap finish EXIT

# TEST_REPORTS and TEST_ARTIFACTS are exported so docker-compose doesn't
# complain about them being undefined, but we don't use them so they can
# be blank.
export TEST_REPORTS=""
export TEST_ARTIFACTS=""

# Setup recipe-server container
echo "Initializing functional testing containers"
pushd "$REPO_DIR/compose"
./bin/genkeys.sh
compose run -e CHECK_PORT=5432 -e CHECK_HOST=database takis # Wait for database
compose run normandy ./manage.py flush --no-input
compose run normandy ./manage.py migrate --no-input
compose run normandy ./manage.py update_actions
compose run normandy ./manage.py update_product_details
compose run normandy ./manage.py initial_data
compose run normandy ./bin/create_test_admin.py
popd

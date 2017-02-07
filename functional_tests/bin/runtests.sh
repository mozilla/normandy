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

# TEST_REPORTS and TEST_ARTIFACTS are exported so the docker-compose config can
# use them to mount the artifact volume.
export TEST_REPORTS=$1
export TEST_ARTIFACTS=$2

# Run tests
echo "Running functional tests"

# Flush and re-initialize the database
pushd "$REPO_DIR/compose"
compose run -e CHECK_PORT=5432 -e CHECK_HOST=database takis # Wait for database
compose run normandy ./manage.py flush --no-input
compose run normandy ./manage.py migrate --no-input
compose run normandy ./manage.py update_actions
compose run normandy ./manage.py update_product_details
compose run normandy ./manage.py initial_data
compose run normandy ./bin/create_test_admin.py
popd

# Run the tests
compose run -e CHECK_PORT=8000 -e CHECK_HOST=normandy takis # Wait for server
compose run functionaltestrunner py.test --html=/test_artifacts/report.html --junitxml=/test_reports/pytest.xml

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
compose run functionaltestrunner ./bin/wait-for-it.sh normandy:8000
compose run functionaltestrunner py.test --html=/test_artifacts/report.html --junitxml=/test_reports/pytest.xml

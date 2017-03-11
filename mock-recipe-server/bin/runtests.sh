#!/usr/bin/env bash
set -eu

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../.. && pwd)"

DOCKER_ARGS=( )
PYTEST_ARGS=( )

if [[ -v CIRCLE_TEST_REPORTS ]]; then
  DOCKER_ARGS+=(--volume $CIRCLE_TEST_REPORTS:/test_artifacts)
  PYTEST_ARGS+=(--junitxml=/test_artifacts/mock-recipe-server-pytest.xml)
fi

docker run \
  --env DJANGO_CONFIGURATION=Test \
  --net host \
  --volume $1:/mock-recipe-server-build \
  --volume $REPO_DIR/mock-recipe-server:/mock-recipe-server \
  "${DOCKER_ARGS[@]}" \
  mozilla/normandy:latest \
  pytest \
  "${PYTEST_ARGS[@]}" \
  --mock-server-dir=/mock-recipe-server-build \
  /mock-recipe-server

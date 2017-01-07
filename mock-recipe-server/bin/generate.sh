#!/usr/bin/env bash
set -eu

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../.. && pwd)"

# MOCK_SERVER_ARTIFACTS is exported so the docker-compose config can
# use it to mount the artifact volume.
export MOCK_SERVER_ARTIFACTS=$1
MOCK_SERVER_DOMAIN=$2

# Generate mock server files
echo "Generating mock server files"
docker-compose \
  -p mockrecipeserver \
  -f "$REPO_DIR/compose/docker-compose.yml" \
  -f "$REPO_DIR/mock-recipe-server/docker-compose.yml" \
  run \
  testgen /mock-server/generate.py /build $MOCK_SERVER_DOMAIN

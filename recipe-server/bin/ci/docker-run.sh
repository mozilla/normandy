#!/usr/bin/env bash

set -x

DOCKER_ARGS=( )

if [[ -v CIRCLE_TEST_REPORTS ]]; then
  DOCKER_ARGS+=(--volume $CIRCLE_TEST_REPORTS:/test_artifacts)
fi

if [[ -f ~/cache/GeoLite2-Country.mmdb ]]; then
  DOCKER_ARGS+=(--volume ~/cache/GeoLite2-Country.mmdb:/app/GeoLite2-Country.mmdb)
fi

# Parse out known command flags to give to `docker run` instead of the command
# After hitting the first unrecognized argument, assume everything else it the
# command to run
while [ $# -ge 1 ]; do
  case $1 in
    --)
      shift
      break
      ;;
    -d|--detach|-i|--interactive|-t|--tty)
      DOCKER_ARGS+=($1)
      shift
      ;;
    -p|--publish|-e|--env|-u|--user)
      DOCKER_ARGS+=($1 $2)
      shift
      shift
      ;;
    *)
      break
      ;;
  esac
done

docker run \
  --env DJANGO_CONFIGURATION=Test \
  "${DOCKER_ARGS[@]}" \
  mozilla/normandy:latest \
  "$@"

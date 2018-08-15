#!/usr/bin/env bash
set -eu

# Usage: retry MAX CMD...
# Retry CMD up to MAX times. If it fails MAX times, returns failure.
# Example: retry 3 docker push "mozilla/normandy:$TAG"
function retry() {
    max=$1
    shift
    count=1
    until "$@"; do
        count=$((count + 1))
        if [[ $count -gt $max ]]; then
            return 1
        fi
        echo "$count / $max"
    done
    return 0
}

# configure docker creds
echo "$DOCKER_PASSWORD" | docker login --username="$DOCKER_USERNAME" --password-stdin

# docker tag and push git branch to dockerhub
if [ -n "$1" ]; then
    # Tag docker-compose built image
    docker tag normandy:web
    if [ "$1" == master ]; then
        TAG=latest
    else
        TAG="$1"
        docker tag mozilla/normandy:latest "mozilla/normandy:$TAG" ||
            (echo "Couldn't re-tag mozilla/normandy:latest as mozilla/normandy:$TAG" && false)
    fi
    retry 3 docker push "mozilla/normandy:$TAG" ||
        (echo "Couldn't push mozilla/normandy:$TAG" && false)
    echo "Pushed mozilla/normandy:$TAG"
fi

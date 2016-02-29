#!/bin/bash

# THIS IS MEANT TO BE RUN BY CI

set -e

# configure docker creds
docker login -e="$DOCKER_EMAIL" -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD"

# docker tag and push git branch to dockerhub
if [ -n "$1" ]; then
    [ "$1" == master ] && TAG=latest || TAG="$1"
    docker tag normandy:build "mozilla/normandy:$TAG" ||
        (echo "Couldn't tag normandy:build as mozilla/normandy:$TAG" && false)
    docker push "mozilla/normandy:$TAG" ||
        (echo "Couldn't push mozilla/normandy:$TAG" && false)
    echo "Pushed mozilla/normandy:$TAG"
fi

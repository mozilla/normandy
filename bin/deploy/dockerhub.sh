#!/bin/bash

# THIS IS MEANT TO BE RUN BY TRAVIS CI

set -e

# configure docker creds
docker login -e="$DOCKER_EMAIL" -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD"

# docker tag and push git branch to dockerhub
if [ -n "$TRAVIS_BRANCH" ]; then
    [ "$TRAVIS_BRANCH" == master ] && TAG=latest || TAG="$TRAVIS_BRANCH"
    docker tag normandy:build "mozilla/normandy:$TAG" ||
        (echo "Couldn't tag normandy:build as mozilla/normandy:$TAG" && false)
    docker push "mozilla/normandy:$TAG" ||
        (echo "Couldn't push mozilla/normandy:$TAG" && false)
    echo "Pushed mozilla/normandy:$TAG"
fi

# docker tag and push git tag to dockerhub
if [ -n "$TRAVIS_TAG" ]; then
    docker tag normandy:build "mozilla/normandy:$TRAVIS_TAG" ||
        (echo "Couldn't tag normandy:build as mozilla/normandy:$TRAVIS_TAG" && false)
    docker push "mozilla/normandy:$TRAVIS_TAG" ||
        (echo "Couldn't push mozilla/normandy:$TRAVIS_TAG" && false)
    echo "Pushed mozilla/normandy:$TRAVIS_TAG"
fi

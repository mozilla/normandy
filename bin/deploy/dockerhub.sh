#!/bin/bash

# THIS IS MEANT TO BE RUN BY TRAVIS CI

set -e
set -x

# do nothing unless we have docker creds
if [ -n "$DOCKER_EMAIL" -a -n "$DOCKER_USERNAME" -a -n "$DOCKER_PASSWORD" ]; then
    # configure docker creds
    docker login -e="$DOCKER_EMAIL" -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD"

    # docker tag and push git branch to dockerhub
    if [ -n "$TRAVIS_BRANCH" ]; then
        [ "$TRAVIS_BRANCH" == master ] && TAG=latest || TAG="$TRAVIS_BRANCH"
        docker tag normandy:build "mozilla/normandy:$TAG"
        docker push "mozilla/normandy:$TAG"
    fi

    # docker tag and push git tag to dockerhub
    if [ -n "$TRAVIS_TAG" ]; then
        docker tag normandy:build "mozilla/normandy:$TRAVIS_TAG"
        docker push "mozilla/normandy:$TRAVIS_TAG"
    fi
fi

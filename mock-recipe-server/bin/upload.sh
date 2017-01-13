#!/usr/bin/env bash
set -eu

if [[ $# -ne 2 ]]; then
    echo "Usage: $0 BUILD_DIR S3_BUCKET"
    exit 1
fi

BUILD_DIR=$1
S3_BUCKET=$2

aws s3 sync --delete "$BUILD_DIR" "s3://$S3_BUCKET/" --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers

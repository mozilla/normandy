#!/usr/bin/env bash
set -eu

BUILD_DIR=$1
S3_BUCKET=$2

aws s3 rm --recursive "s3://$S3_BUCKET/"
aws s3 cp --recursive "$BUILD_DIR" "s3://$S3_BUCKET/" --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers

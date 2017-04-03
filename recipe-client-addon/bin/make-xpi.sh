#!/usr/bin/env bash

set -eu

BASE_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
TMP_DIR=$(mktemp -d)
DEST="${TMP_DIR}/shield-recipe-client"

mkdir -p $DEST

# deletes the temp directory
function cleanup {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

while read -r LINE || [[ -n "${LINE}" ]]; do
  mkdir -p "$(dirname "${DEST}/${LINE}")"
  cp -r "${BASE_DIR}/${LINE}" "$(dirname "${DEST}/${LINE}")"
done < "${BASE_DIR}/build-includes.txt"

rm "${DEST}/install.rdf.in"
cp "${BASE_DIR}/install.rdf" "${DEST}"
rm "${DEST}/jar.mn"
cp "${BASE_DIR}/chrome.manifest" "${DEST}"
rm -r "${DEST}/test"

pushd $DEST
zip -r shield-recipe-client.xpi *
mv shield-recipe-client.xpi $BASE_DIR
popd

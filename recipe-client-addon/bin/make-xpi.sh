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

# Build vendor files
pushd $BASE_DIR
npm run build
popd

while read -r LINE || [[ -n "${LINE}" ]]; do
  mkdir -p "$(dirname "${DEST}/${LINE}")"
  cp -r "${BASE_DIR}/${LINE}" "$(dirname "${DEST}/${LINE}")"
done < "${BASE_DIR}/build-includes.txt"

# This produces versions like "45", "45.5.abcdef", and "45.5.abcdef.dirty"
version=$(git describe --dirty | sed -e 's/^v//' -e 's/-/./g')
sed -e "s/@NORMANDY_VERSION@/${version}/" \
    -e 's/@MOZ_APP_VERSION@/52/' \
    -e 's/@MOZ_APP_MAXVERSION@/*/' \
    -e '/^#filter substitution$/d' \
    "${DEST}/install.rdf.in" \
    > "${DEST}/install.rdf"
rm "${DEST}/install.rdf.in"

rm "${DEST}/jar.mn"
cp "${BASE_DIR}/chrome.manifest" "${DEST}"
rm "${DEST}/test" -r

pushd $DEST
zip -r shield-recipe-client.xpi *
mv shield-recipe-client.xpi $BASE_DIR
popd

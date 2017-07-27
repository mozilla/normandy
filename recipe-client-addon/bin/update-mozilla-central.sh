#!/usr/bin/env bash

set -eu

baseDir="$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )")"
mozCentral=""
buildVendor=false

while [[ $# -gt 0 ]]
do
key="$1"

case $key in
  -b|--build-vendor)
  buildVendor=true
  ;;
  *)
  # Assumed to be the path to mozilla-central
  mozCentral=$key
  ;;
esac
shift # past argument
done

if [[ -z "$mozCentral" ]]; then
  echo "usage: $(basename $0) [-b|--build-vendor] MOZ-CENTRAL" >&2
  exit 1
fi

dest="${mozCentral}/browser/extensions/shield-recipe-client"

if [[ ! -d "$dest" ]]; then
  echo "Sync destination $dest does not exist" >&2
  exit 1
fi

rm -rf "${dest}"/*

# Build vendor files
if [[ "$buildVendor" = true ]]; then
  pushd $baseDir
  npm run build
  popd
fi

while read -r line || [[ -n "${line}" ]]; do
  mkdir -p "$(dirname "${dest}/${line}")"
  cp -r "${baseDir}/${line}" "$(dirname "${dest}/${line}")"
done < "${baseDir}/build-includes.txt"

# This produces versions like "45", "45.5.abcdef", and "45.5.abcdef.dirty"
version=$(git -C "${baseDir}" describe --dirty | sed -e 's/^v//' -e 's/-/./g')
if [[ -z "$version" ]]; then
    version=$(git -C "${baseDir}" rev-parse HEAD)
fi
sed -i -e "s/@NORMANDY_VERSION@/${version}/" "${dest}/install.rdf.in"

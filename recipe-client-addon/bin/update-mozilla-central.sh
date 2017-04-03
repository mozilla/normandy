#!/usr/bin/env bash

set -eu

if [[ $# -lt 1 ]]; then
  echo "usage: $(basename $0) MOZ-CENTRAL" >&2
  exit 1
fi

baseDir="$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )")"
mozCentral="$1"
dest="${mozCentral}/browser/extensions/shield-recipe-client"

rm -rf "${dest}"/*

while read -r line || [[ -n "${line}" ]]; do
  mkdir -p "$(dirname "${dest}/${line}")"
  cp -r "${baseDir}/${line}" "$(dirname "${dest}/${line}")"
done < "${baseDir}/build-includes.txt"

# This produces versions like "45", "45.5.abcdef", and "45.5.abcdef.dirty"
version=$(git -C "${baseDir}" describe --dirty | sed -e 's/^v//' -e 's/-/./g')
sed -i -e "s/@NORMANDY_VERSION@/${version}/" "${dest}/install.rdf.in"

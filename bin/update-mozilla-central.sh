#!/usr/bin/env bash

set -eu

if [[ $# -lt 1 ]]; then
  echo "usage: $(basename $0) MOZ-CENTRAL" >&2
  exit 1
fi

baseDir="$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )")"
mozCentral="$1"
dest="${mozCentral}/browser/extensions/shield-recipe-client"

echo "Clearing destination"
rm -rf "${dest}"/*

echo "Placing add-on files"
while read -r line || [[ -n "${line}" ]]; do
  mkdir -p "$(dirname "${dest}/${line}")"
  cp -rv "${baseDir}/${line}" "$(dirname "${dest}/${line}")"
done < "${baseDir}/build-includes.txt"

echo "Done"

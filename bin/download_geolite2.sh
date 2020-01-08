#!/usr/bin/env bash
# This script downloads and extracts the free GeoLite2 country database
# from MaxMind for use in development.
# The licence key is read from environment variable $MAXMIND_LICENCE_KEY, and can be obtained
# from https://www.maxmind.com
BASE_DIR="$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )")"
DOWNLOAD_URL=https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=${MAXMIND_LICENCE_KEY}&suffix=tar.gz
LOCAL_ARCHIVE=/tmp/GeoLite2-Country.mmdb

curl -o "$LOCAL_ARCHIVE" "$DOWNLOAD_URL"
mv "$LOCAL_ARCHIVE" "$BASE_DIR"

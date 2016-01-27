#!/bin/bash
# This script downloads and extracts the free GeoLite2 country database
# from MaxMind for use in development.
BASE_DIR="$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )")"
DOWNLOAD_URL=http://geolite.maxmind.com/download/geoip/database/GeoLite2-Country.mmdb.gz
LOCAL_ARCHIVE=/tmp/GeoLite2-Country.mmdb.gz
LOCAL_EXTRACTED=/tmp/GeoLite2-Country.mmdb

curl -o "$LOCAL_ARCHIVE" "$DOWNLOAD_URL"
gunzip -f "$LOCAL_ARCHIVE"
mv "$LOCAL_EXTRACTED" "$BASE_DIR"

#!/bin/bash
FIREFOX_VERSION=47.0
FIREFOX_URL="https://ftp.mozilla.org/pub/mozilla.org/firefox/releases/${FIREFOX_VERSION}/linux-x86_64/en-US/firefox-${FIREFOX_VERSION}.tar.bz2"
CACHE_DIR=~/cache/firefox/

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo $BASE_DIR
cd $BASE_DIR

# Check for cached version of Firefox
if [ ! -d "$CACHE_DIR/$FIREFOX_VERSION" ]; then
    rm -rf $CACHE_DIR
    mkdir -p $CACHE_DIR/$FIREFOX_VERSION

    TARBALL=$CACHE_DIR/firefox-$FIREFOX_VERSION.tar.bz2
    curl -sSL $FIREFOX_URL | tar -xjC $CACHE_DIR/$FIREFOX_VERSION --strip-components 1
fi

# Start Firefox with Marionette enabled.
PROFILE_DIR=$(mktemp -d)
$CACHE_DIR/$FIREFOX_VERSION/firefox -marionette -profile $PROFILE_DIR -no-remote -new-instance &
PID=$!

# Start the app
echo "Setting up Normandy"
dropdb --if-exists normandy
createdb normandy
./docker-run.sh -i -t ./manage.py migrate
./docker-run.sh -i -t ./manage.py update_product_details
./docker-run.sh -i -t ./manage.py initial_data
./docker-run.sh -i -t ./manage.py update_actions
echo "Starting Normandy server"
SERVER_ID=$(./docker-run.sh -e DJANGO_CONFIGURATION=ProductionInsecure -d)

docker run --net host -e CHECK_PORT=8000 -e CHECK_HOST=localhost giorgos/takis
echo "Running system tests"
# Run tests
docker run --net host normandy:marionette py.test
STATUS=$?

docker kill $SERVER_ID
kill $PID
exit $STATUS

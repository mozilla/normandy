#!/usr/bin/env bash
# This script starts an SSL development server so that you don't have to
# pass annoying arguments to manage.py all the time.
BASE_DIR="$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )")"
SSL_DIR="$BASE_DIR/etc/ssl"
KEY="$SSL_DIR/normandy_dev.key"
CERT="$SSL_DIR/normandy_dev.crt"

OLD_CERT="$SSL_DIR/normandy_dev.cert"


# If the key or cert don't exist, generate them.
if [ ! -f $KEY ]; then
    mkdir -p $SSL_DIR
    openssl genrsa -out $KEY 2048
fi

if [ ! -f $CERT ]; then
    if [ -f $OLD_CERT ]; then
        echo "Moving existing SSL certificate from $OLD_CERT to $CERT"
        mv $OLD_CERT $CERT
    else
        openssl req -new -x509 -nodes -sha256 -key $KEY \
            -subj "/C=US/ST=Test/L=Test/O=Mozilla/CN=normandy_dev" > $CERT
    fi
fi

$BASE_DIR/manage.py runserver_plus \
    --cert-file=$CERT \
    "$@"

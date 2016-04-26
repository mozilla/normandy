#!/bin/bash
# This script generates SSL keys for the Nginx proxy.
BASE_DIR="$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )")"
SSL_DIR="$BASE_DIR/ssl"
KEY="$SSL_DIR/proxy.key"
CERT="$SSL_DIR/proxy.crt"

# If the key or cert don't exist, generate them.
if [ ! -f $KEY ]; then
    mkdir -p $SSL_DIR
    openssl genrsa -out $KEY 2048
fi

if [ ! -f $CERT ]; then
    openssl req -new -x509 -nodes -sha256 -key $KEY \
        -subj "/C=US/ST=Test/L=Test/O=Mozilla/CN=normandy_dev" > $CERT
fi

#!/usr/bin/env bash
set -u
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo $BASE_DIR
cd $BASE_DIR

echo "Setting up Normandy"
createdb normandy
./docker-run.sh -i -t ./manage.py migrate
./docker-run.sh -i -t ./manage.py update_product_details
./docker-run.sh -i -t ./manage.py initial_data
./docker-run.sh -i -t ./manage.py update_actions
echo "Starting Normandy server"
SERVER_ID=$(./docker-run.sh -e DJANGO_CONFIGURATION=ProductionInsecure -d)

docker run --net host -e CHECK_PORT=8000 -e CHECK_HOST=localhost giorgos/takis
echo "Running acceptance tests"
./docker-run.sh py.test contract-tests/ \
  --server http://localhost:8000 \
  --junitxml=/test_artifacts/pytest.xml
STATUS=$?

docker kill $SERVER_ID
exit $STATUS

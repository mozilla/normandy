#!/usr/bin/env bash
set -eo pipefail

usage() {
  echo "usage: ./bin/run.sh python-tests|js-tests|start|migrations-check"
  exit 1
}

function start_gunicorn {
  $CMD_PREFIX gunicorn \
  --log-file - \
  --worker-class ${GUNICORN_WORKER_CLASS:-sync} \
  --max-requests ${GUNICORN_MAX_REQUESTS:-0} \
  normandy.wsgi:application
}

[ $# -lt 1 ] && usage

case $1 in
  migrations-check)
    ./manage.py migrate
    echo "Checking that all migrations have been made"
    # The mozilla-django-product-details has a bug in that calling `./manage.py makemigrations`
    # on it will actually create a new migration (.py) file. So, be specific and only do this
    # migration check for *our* apps.
    # See https://github.com/mozilla/django-product-details/issues/68
    ./manage.py makemigrations --check --no-input --dry-run recipes studies || (
      echo "You probably have migrations that need to be created" && exit 1
    )
    ;;
  python-tests)
    echo "Running Python tests"
    junit_path=$ARTIFACTS_PATH/test_results/python_tests
    mkdir -p $junit_path
    py.test -vv --junitxml=$junit_path/junit.xml normandy/
    ;;
  js-tests)
    echo "Running Karma"
    node ci/karma-ci.js
    ;;
  first-start)
    echo "Starting the gunicorn server the first time"
    ./manage.py migrate
    ./manage.py update_actions
    start_gunicorn
    ;;
  start)
    start_gunicorn
    ;;
  contracttest)
    echo "Waiting for web server to start"
    ./ci/wait-for-it.sh -t 30 web:8000 -- echo "Done waiting. It should work now."
    echo "Running acceptance tests"
    junit_path=$ARTIFACTS_PATH/test_results/contract_tests
    mkdir -p $junit_path
    py.test contract-tests/ \
      -vv \
      --server http://web:8000 \
      --junitxml=$junit_path/junit.xml
    ;;
  *)
    exec "$@"
    ;;
esac

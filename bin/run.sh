#!/usr/bin/env bash
set -eo pipefail

usage() {
  echo "usage: ./bin/run.sh pytests|jstests|lint|start"
  exit 1
}

[ $# -lt 1 ] && usage

case $1 in
  lint)
    echo "Linting Python files"
    python_to_lint="normandy/ contract-tests/ manage.py docs/ bin/"
    flake8 $python_to_lint
    black --check $python_to_lint
    pip check

    echo "Linting JS files"
    yarn lint:js

    echo "Checking JS package security"
    # Disable automatic failure
    set +e
    # nsp uses exit code 1 for security problems
    yarn run lint:js-security
    if [[ $? -eq 1 ]]; then
        exit 1
    fi
    set -e
    ;;
  pytest)
    echo "Running Python tests"
    junit_path=$ARTIFACTS_PATH/test_results/python_tests
    mkdir -p $junit_path
    py.test -vv --junitxml=$junit_path/junit.xml normandy/
    ;;
  karma)
    apt install -y --no-install-recommends firefox-esr
    npm install -g get-firefox
    get-firefox -e
    ./firefox/firefox --version
    (
      echo "Waiting for karma server to start"
      mkdir -p $ARTIFACTS_PATH/test_results/karma
      ./ci/wait-for-it.sh -t 30 0.0.0.0:9876 -- firefox/firefox 0.0.0.0:9876 --headless
      echo "Done waiting"
    ) &
    echo "Running Karma"
    node ci/karma-ci.js
    pkill firefox
    rm -fr firefox
    ;;
  first-start)
    echo "Starting the gunicorn server the first time"
    ./manage.py migrate
    ./manage.py update_actions
    $CMD_PREFIX gunicorn \
    --log-file - \
    --worker-class ${GUNICORN_WORKER_CLASS:-sync} \
    --max-requests ${GUNICORN_MAX_REQUESTS:-0} \
    normandy.wsgi:application
    ;;
  start)
    $CMD_PREFIX gunicorn \
    --log-file - \
    --worker-class ${GUNICORN_WORKER_CLASS:-sync} \
    --max-requests ${GUNICORN_MAX_REQUESTS:-0} \
    normandy.wsgi:application
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

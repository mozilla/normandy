# API Contract Tests

It's highly recommended to use [Virtualenv](https://virtualenv.pypa.io/en/latest/)
in order to have an isolated environment.

From the root directory of the project

1. `virtualenv venv`
2. `source venv/bin/activate` to turn on the virtualenv
2. `./venv/bin/pip install -r test-requirements.txt`


### Schema Check Tests

These tests are designed to look for changes to the recipe server API that are
not expected.

`py.test --env=<environment> contract-tests/`

where `<environment>` is one of `dev`, `stage`, or `prod`

API Contract Tests
==================

These tests are designed to look for changes to the recipe server APIs that are
not expected.

Requirements
------------

Before running these tests you will need the following installed:

* Docker (https://docker.com)
* The `make` CLI tool
* Python 3.7.0 or greater
* virtualenv (https://virtualenv.pypa.io/en/latest/virtualenv)

Before running these tests you need to create a virtual environment using
Python 3.7.0 or greater. If you have an existing environment running
Normandy, you can re-use that environment and skip this step. To create it do
the following:

.. code-block:: bash

    virtualenv -p /path/to/python3.7 venv
    source venv/bin/activate
    pip install -r requirements/dev.txt

This creates the virtual environment, activates it, and installs the Python
dependencies needed to run the tests.

With the virtual environment created, then you need to build the Dockerized
version of the application and populate it with some data that can be used
for testing purposes

To do so, use the following commands:

.. code-block:: bash

    make refresh
    docker-compose up -d

`make refresh` builds a Normandy image and a Postgresql image. It then populates 
the application data we can use for testing purposes.

`docker-compose up -d` makes sure the Normandy application and Postgres database
are up and running and ready to run the API contract tests against.


API Tests
------------

To run these tests against both the V1 and V3 APIs use the following command
from the root project directory.

.. code-block:: bash

    py.test -v --server=<server> contract-tests/

where ``<server>`` is the server you want to test, such as
``https://stage.normandy.cloudops.mozgcp.net`` or `https://localhost:8000`.


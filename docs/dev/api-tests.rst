API Contract Tests
==================

These tests are designed to look for changes to the recipe server API that are
not expected.

To run these tests, use the following command from the root project directory.

.. code-block:: bash

    py.test --env=<environment> contract-tests/

where ``<environment>`` is one of `dev`, `stage`, or `prod`

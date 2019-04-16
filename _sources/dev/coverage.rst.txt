=============
Test Coverage
=============

We do not include test coverage as a metric or a requirement in CI but test coverage as a
local tool is useful to make sure your code does test all the things you care about.

To use it, install ``coverage`` in your virtualenv env.

.. code-block:: bash

    pip install coverage

Now run the tests with coverage like this:

.. code-block:: bash

    coverage run -m pytest normandy

To generate a report, run:

.. code-block:: bash

    coverage html --skip-covered

This will create the HTML report in the ``./htmlcov/`` directory.

.. code-block:: bash

    open htmlcov/index.html

.. note::

    The ``--skip-covered`` flag means it doesn't create a HTML report for files with 100%
    test coverage.

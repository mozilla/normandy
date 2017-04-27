Workflow
========
The following is a list of things you'll probably need to do at some point while
working on the recipe client. The majority of these steps assume that you have
a working :ref:`mozilla-central checkout <build-moz-central>`.

Building an XPI
---------------
The ``make-xpi.sh`` script builds an XPI file from the current recipe-client
files:

.. code-block:: bash

   cd recipe-client-addon
   ./bin/make-xpi.sh # Creates /recipe-client-addon/shield-recipe-client.xpi

.. _recipe-client-sync:

Sync changes to mozilla-central
-------------------------------
The ``update-mozilla-central.sh`` script copies the recipe-client files to a
checkout of mozilla-central. The files that are copied over are determined by
``build-includes.txt``.

.. code-block:: bash

   cd recipe-client-addon
   ./bin/update-mozilla-central.sh /path/to/mozilla-central

.. _recipe-client-tests:

Writing and Running Tests
-------------------------
The recipe client tests are designed to be run using mozilla-central's test
frameworks. There are multiple test suites:

* mochitest_ tests, located in ``/recipe-client-addon/test/browser``, are run in
  a webpage that can import and run chrome code. Mochitest can test pretty much
  anything, but running the test requires you to focus the browser windows that
  the test framework opens, and the test output is sometimes difficult to read.

* xpcshell_ tests, located in ``/recipe-client-addon/test/unit``, are run in a
  JavaScript shell. We are planning to migrate these tests to mochitest; do not
  write new tests as xpcshell tests where possible.

To run the tests, you must sync your code to mozilla-central, and use the
``./mach test`` command:

.. code-block:: bash

   cd recipe-client-addon
   ./bin/update-mozilla-central.sh /path/to/mozilla-central
   cd /path/to/mozilla-central
   ./mach test browser/extensions/shield-recipe-client/test

.. note::

   ``./mach test`` can also be given a subdirectory or single file as an
   argument if you only want to run a single test rather than the entire test
   suite.

.. _xpcshell: https://developer.mozilla.org/en-US/docs/Mozilla/QA/Writing_xpcshell-based_unit_tests
.. _mochitest: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/Mochitest

.. _recipe-client-lint:

Linting
-------
The ``./mach lint`` command is used in mozilla-central to lint code, and we use
it as well so that we don't get lint errors when syncing code.

.. code-block:: bash

   cd recipe-client-addon
   ./bin/update-mozilla-central.sh /path/to/mozilla-central
   cd /path/to/mozilla-central
   ./mach lint browser/extensions/shield-recipe-client

You can also perform limited linting using eslint_ directly. To do this, you
must install the development dependencies from
``/recipe-client-addon/package.json`` in the same environment that eslint is
installed within to get the eslint plugins we rely on:

.. code-block:: bash

   cd recipe-client-addon
   npm install
   ./node_modules/.bin/eslint .

.. _eslint: http://eslint.org/

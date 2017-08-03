Workflow
========
The following is a list of things you'll probably need to do at some point while
working on the recipe client. The majority of these steps assume that you have
a working :ref:`mozilla-central checkout <build-moz-central>`.

Building and Using Dependencies
-------------------------------
Before building an XPI or syncing changes to mozilla-central, you must first
install and build the latest dependencies:

.. code-block:: bash

   cd recipe-client-addon
   npm install
   npm run build

This will create a ``vendor`` directory containing a ``.js`` for each
third-party library that the add-on uses. They can be imported like other
JavaScript files:

.. code-block:: javascript

   Cu.import("resource://shield-recipe-client/vendor/mozjexl.js");
   const jexl = new mozjexl.Jexl();

Adding New Dependencies
-----------------------
To add a dependency:

1. Install the dependency and add it to ``package.json``:

   .. code-block:: bash

      npm install --save ajv@5.2.2

   Version numbers in ``package.json`` must be set to an exact match to avoid
   bugs from downloading newer versions of libraries that we haven't tested
   the add-on against yet.

2. Add the dependency to ``recipe-client-addon/webpack.config.js`` as an entry
   point:

   .. code-block:: javascript

      module.exports = {
        entry: {
          // The key is the name to export the library under
          // The value is the path to the library's folder in node_modules
          ajv: "./node_modules/ajv",
        },
      };

3. Re-build the vendor directory via ``npm run build``. Ensure that licensing
   info for the library was added to the ``LICENSE_THIRDPARTY`` file generated
   within ``vendor`` so that we have licensing information for our dependencies.

.. note::

   Currently, we do not expose certain browser globals (such as ``fetch``) that
   libraries may depend on. Be sure to test that libraries you add will work
   properly in a chrome environment that they may not have been built for.

Building an XPI
---------------
The ``make-xpi.sh`` script builds an XPI file from the current recipe-client
files:

.. code-block:: bash

   cd recipe-client-addon
   ./bin/make-xpi.sh # Creates /recipe-client-addon/shield-recipe-client.xpi

If the vendor directory hasn't been built, ``make-xpi.sh`` auto-builds it. Or,
pass the ``-b``/``--build-vendor`` flag to force-build vendor dependencies
before creating the XPI.

.. _recipe-client-sync:

Sync changes to mozilla-central
-------------------------------
The ``update-mozilla-central.sh`` script copies the recipe-client files to a
checkout of mozilla-central. The files that are copied over are determined by
``build-includes.txt``.

.. code-block:: bash

   cd recipe-client-addon
   ./bin/update-mozilla-central.sh /path/to/mozilla-central

If the vendor directory hasn't been built, ``update-mozilla-central.sh``
auto-builds it. Or, pass the ``-b``/``--build-vendor`` flag to force-build
vendor dependencies before copying files to the checkout.

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

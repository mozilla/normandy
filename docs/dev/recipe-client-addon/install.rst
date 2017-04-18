Developer Setup
===============
The following describes how to set up a local development environment for
working on the recipe client add-on.

Prerequisites
-------------
This guide assumes you have already installed and set up the following:

1. Git_
2. `Node.js`_ and npm.

These docs assume a Unix-like operating system.

.. _Git: https://git-scm.com/
.. _Node.js: https://nodejs.org/en/

Building an XPI
---------------
The easiest way to build and run the system add-on is to build an XPI file and
install it in Firefox. This allows you to manually run the add-on, but does not
support running automated tests or lints.

Building the add-on is done using the ``make-xpi.sh`` script:

.. code-block:: bash

   cd recipe-client-addon
   ./bin/make-xpi.sh

This will create a file named ``shield-recipe-client.xpi`` in the
``recipe-client-addon`` directory. This add-on can be installed in Firefox in
several ways:

1. By loading it as a `temporary add-on`_.
2. By dragging and dropping the XPI file onto Firefox
3. By opening the XPI file using the File -> Open menu ite,
4. Using the "Install add-on from file" option under the tools menu in the
   extension listing in ``about:addons``.
5. On MacOS, by using the ``open`` command:

   .. code-block:: bash

      open shield-recipe-client.xpi -a FirefoxDeveloperEdition

.. note::

   Because add-ons built this way are not signed, they cannot be installed on
   Firefox instances set to the release or beta channels, unless you load them
   as temporary add-ons. If you want to persistently install the unsigned
   add-on, you must either use Nightly_, or an `unbranded build of Firefox`_.

.. _temporary add-on: https://developer.mozilla.org/en-US/docs/Tools/about%3Adebugging#Loading_a_temporary_add-on
.. _Nightly: https://www.mozilla.org/en-US/firefox/channel/desktop/#nightly
.. _unbranded build of Firefox: https://wiki.mozilla.org/Add-ons/Extension_Signing#Unbranded_Builds

.. _build-moz-central:

Building mozilla-central
------------------------
If you want to create a build of Firefox with the system add-on loaded by
default, or if you want to run the automated test suite and linting, you must
create a checkout of mozilla-central_ (the master repository for Firefox) and
sync your changes to it.

1. First, you must `download and build Firefox <building-firefox>`_. When asked,
   choose to do an Artifact Build for Desktop; this will make your builds faster
   since we do not generally alter code that requires a full build of Firefox.

2. Next, to sync your changes to your checkout, pass the path to your
   mozilla-central checkout to the ``update-mozilla-central.sh`` script:

   .. code-block:: bash

      cd recipe-client-addon
      ./bin/update-mozilla-central.sh /path/to/mozilla-central

3. To build Firefox after syncing your changes, use mach_:

   .. code-block:: bash

      cd /path/to/mozilla-central
      ./mach build
      ./mach run # To run the build you just created

Once you've got your mozilla-central checkout set up, you can
:ref:`run the tests <recipe-client-tests>` or
:ref:`lint your code <recipe-client-lint>`.

.. _mozilla-central: https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/mozilla-central
.. _building-firefox: https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/Build_Instructions/Simple_Firefox_build
.. _mach: https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/mach

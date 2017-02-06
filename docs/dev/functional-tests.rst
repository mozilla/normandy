Functional Tests
================
Normandy includes a set of functional tests that run using Selenium_ that help
test how the service behaves in an end-to-end fashion.

Automation is typically set up to run this automatically, but you can manually
run the tests as well.

.. _Selenium: http://www.seleniumhq.org/

Prerequisites
-------------
- `Docker <https://docs.docker.com/engine/installation/>`_
- `docker-compose <https://docs.docker.com/compose/>`_

Generating Files
----------------
1. If this is your first time running the tests, you must run the setup script
   to create the docker containers used for running the tests:

   .. code-block:: bash

      # From the root of the repo
      cd functional_tests
      ./bin/setup.sh

2. Run the ``runtests.sh`` file, passing in the path where you wish to save the
   XML test report, and the path you wish to save the HTML test results:

   .. code-block:: bash

      ./bin/runtests.sh /path/to/reports /path/to/artifacts

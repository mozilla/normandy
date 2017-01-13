Mock Recipe Server
==================
The mock recipe server is a set of static files that mimic the recipe server's
API to allow for testing of the :ref:`runtime` against test data easily.

Automation is typically set up to run this automatically, but you can manually
generate the files as well.

Prerequisites
-------------
- `Docker <https://docs.docker.com/engine/installation/>`_
- `docker-compose <https://docs.docker.com/compose/>`_

Generating Files
----------------
1. If this is your first time generating the files, you must run the setup
   script to create the docker containers used for building the files:

   .. code-block:: bash

      # From the root of the repo
      cd mock-recipe-server
      ./bin/setup.sh

2. Run the ``generate.sh`` file, passing in the path where you wish to save the
   generated files, and the domain to use for absolute URLs:

   .. code-block:: bash

      ./bin/generate.sh /path/to/directory https://normandy-mock.dev.mozaws.net

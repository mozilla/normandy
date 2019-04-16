Continuous Integration
======================

Almost everything that is run in CI (using CircleCI_) is designed to be possible to run locally.
This helps in that it's easier to use your own laptop to debug potential problems that only
happen in CI.

.. note:: "Almost everything", because pushing to `Docker Hub`_ is not something you can do
          from your laptop.


.. _Docker Hub: https://hub.docker.com/
.. _CircleCI: https://circleci.com/gh/mozilla/normandy


Running Suite
-------------

The steps in ``.circleci/config.yml`` should be sufficiently self-explanatory. Each step should
work to just copy and paste into your own terminal.

There are some exceptions though. For example, when a step is set up to run with
``background: true`` it means you can run it in its own dedicated terminal and run the
other commands in another terminal.

No Volume Mounts
----------------

The reason we use a collector container is because you can't use volume mounts in CircleCI.
What that means is that if you edit any of the ``.py`` files, for example, after you have run
a suite, you need to build again. For example:

.. code-block:: bash

    docker-compose -f ci/docker-compose.yml build web
    docker-compose -f ci/docker-compose.yml run web pytest
    vi normandy/base/middleware.py
    docker-compose -f ci/docker-compose.yml build web
    docker-compose -f ci/docker-compose.yml run web pytest

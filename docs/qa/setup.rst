Docker for QA
=============
The following describes how to get a pre-built instance of Normandy for
testing. This is not suitable for development, or serving traffic on the
public internet.

Prerequisites
-------------
This guide assumes you have already installed and set up the following:

1. Docker_
2. `Docker Compose`_

.. _Docker: https://docs.docker.com/engine/installation/
.. _Docker Compose: https://docs.docker.com/compose/overview/

Getting the code
----------------
We'll be using Docker Compose to run Normandy and the needed services. The
repository normandy-compose_ contains the ``docker-compose.yml`` file to
describe a Normandy system.

.. _normandy-compose: https://github.com/mozilla/normandy-compose.git

.. code-block:: shell

  $ git clone https://github.com/mozilla/normandy-compose.git
  $ cd normandy-compose

Starting the server, and initial setup
--------------------------------------

1. Generate keys to use for SSL.

   .. code-block:: shell

     $ ./bin/genkeys.sh

2. Start everything, in the background. This downloads Docker images if needed.

   .. code-block:: shell

     $ docker-compose up -d

3. Setup the database schema, and needed data

   .. code-block:: shell

     $ docker-compose run normandy ./manage.py migrate
     $ docker-compose run normandy ./manage.py update_actions
     $ docker-compose run normandy ./manage.py createsuperuser

4. Open the site. If you are using Docker Machine, get your VM's IP with
   ``docker-machine ip``. Otherwise, use localhost. A full URL (on Linux) is:
   ``https://localhost:8443/admin``. Accept the self-signed certificate.

5. When finished, shut everything down.

   .. code-block:: shell

     $ docker-compose stop

   This will preserve all data used by the containers. In the future, follow
   step 2 again to start the servers.

Customization
-------------
Any customization of the server should be done by editing ``docker-compose.yml``.

Using a different version of Normandy
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
To use a different version of Normandy (or any other Docker image in the group)
Normandy, change the line ``image: mozilla/normandy:latest`` to
``image: mozilla/normandy:v6``.

Changing configuration options
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Normandy is configured through environment variables, which can be set by
editing ``services.normandy.environment``. For example, to change the time that
recipes are cached for, add a line ``DJANGO_CACHES_RECIPE_TIME: 5`` in the
``environment`` section.

Getting the addon
-----------------
Some functionality of Normandy relies on an addon to provide additional features
in the browser. This addon is under active development. The latest version of
the addon can be found as a `CircleCI build artifact`_.

.. _CircleCI build artifact: https://circle-artifacts.com/gh/mozilla/normandy-addon/latest/artifacts/0/$CIRCLE_ARTIFACTS/recipe-client.xpi

Configuring Firefox
-------------------
Any reference to ``localhost`` should be replaced with the IP where Docker is
actually running. When using Docker Machine, this is the output of
``docker-machine ip``.

.. describe:: browser.selfsupport.url

  The URL that Firefox's built-in Self Repair will load. Change this to
  ``https://localhost:8443/%LOCALE%/repair`` to use the docker-compose Normandy.

.. describe:: browser.uitour.testingOrigins

  A comma-seperated list of domains UITour can run on. In order for Actions to
  run correctly without the addon, add ``https://localhost:8443`` to this value.

.. describe:: extensions.recipeclient.api_url

  The URL that the addon will fetch recipes from. Set this to
  ``https://localhost:8443/api/v1`` to use the local Normandy.

  Note that this value *must* start with ``https``, otherwise the addon will
  reject it.

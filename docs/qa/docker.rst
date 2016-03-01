Docker for QA
=============
The following describes how to get a prebuilt instance of Normandy for
testing. This is not suitable for development.

Prerequisites
-------------
This guide assumes you have already installed and set up the following:

1. Docker_
2. `Postgres 9.4`_

.. _Docker: https://docs.docker.com/engine/installation/
.. _Postgres 9.4: http://www.postgresql.org/

Preparing an environment file
-----------------------------
Normandy gets all of its configuration via environment variables. Docker
has built in support for this pattern. For this set up, we will be using
an environment file to specifiy this configuration, and having Docker
read that file.

Make a file named ``.env``, and put the following in it. We'll go over
how to fill in the blanks next.

.. code-block:: ini

  DATABASE_URL=postgresql://<username>:<password>@<host>/<db_name>

``<username>`` and ``<password>`` are the details to authenticate with
Postgres. ``<db_name>`` is the name of the database to connect to, and
is usually ``normandy``.

``<host>`` is more complicated. This needs to be something that the
Docker container can use to connect to Postgres. This needs to be the IP
address of the machine running Postgres, on a network that the Docker
can access. This can be figured out by looking at the IP address of the
host on the bridge network device.

The defaults for this are *usually* one of these two values:

Linux with local Postgres
  ``172.17.0.1``

_`Docker Toolbox` with local Postgres (OSX or Windows)
  ``192.168.99.1``

.. _the Docker Toolbox: https://docs.docker.com/engine/installation/mac/

Configuring Postgres
--------------------

1. Listening on the Docker IP:

  By default Postgres only listens on localhost, and so Docker containers
  won't be able to connect to it. To change this, edit your Postgres config
  (it is in the Postgres data directory, often at
  ``/var/lib/postgres/postgresql.conf`` or similar). There should be a commented
  out line like:

  .. code-block:: ini

    #listen_addresses = 'localhost'

  Uncomment it, and change it to include the host IP address you found above,
  like:

  .. code-block:: ini

    listen_addresses = 'localhost,172.17.0.1'

2. Allowing connections from the Docker subnet:

   Postgres has ACLs per IP, so we'll need to allow connections from the Docker
   network. Edit your Postgres HBA file, ``pg_hba.conf``. It should be in the
   same place as ``postgresql.conf``. Add a line referencing the docker
   network, like this:

   .. code-block:: ini

     host    all             all             172.17.0.0/16           trust

   For Docker Toolbox, use ``192.168.99.0/24``.

Running Normandy
----------------
1. Download and run the Normandy Docker image:

   .. code-block:: bash

     CID=$(docker run -d -t mozilla/normandy:latest --env-file=.env)

   This runs Normandy in the background and stores the container in the variable
   ``CID``.

2. Get the IP address of the container:

   .. code-block:: bash

     docker inspect --format '{{ .NetworkSettings.IPAddress }}' $CID

3. Open that IP address in a browser, on port 8000. For example,
   ``http://172.17.0.3:8000``.

You should now have an instance of Normandy running in a Docker container.
Congratulations!

Cleaning up
-----------
To shut down the Docker container running in the backgruond, use the command:

.. code-block:: bash

  docker kill $CID

If you lose the CID variable, you can see all running Docker containers with

.. code-block:: bash

  docker ps

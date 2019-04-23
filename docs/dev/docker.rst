Docker Setup for local development
==================================
The following describes how to set up an instance of the site on your
computer for development using the provided docker and docker-compose 
files.

Prerequisites
-------------
This guide assumes you have already installed and set up the following:

1. Git_
2. Docker_
3. Docker-Compose_

These docs assume a Unix-like operating system, although the site should, in
theory, run on Windows as well. All the example commands given below are
intended to be run in a terminal.

Installation
------------
1. Clone this repository or your fork_:

   .. code-block:: bash

      git clone https://github.com/mozilla/normandy.git
      cd normandy

2. Start the docker images via ``docker-compose``:

   .. code-block:: bash

    docker-compose -f ci/docker-compose.yml up -d --build

      
This will build the development dockerfile and start the images for
the database as well. If those images aren't present, they will be
downloaded.

You can now edit code and make changes and these changes will exist inside
of the running docker container named ``web`` using this command:

    .. code-block:: bash

    docker-compose -f ci/docker-compose.yml exec web bash

It is advised to follow steps 6-11 under the Installation_ section.

You can then navigate to ``localhost:8000`` to check that the Normandy API
server has started.

.. _Git: https://git-scm.com/
.. _Docker: https://docs.docker.com/install/
.. _Docker-Compose: https://docs.docker.com/compose/install/
.. _fork: http://help.github.com/fork-a-repo/
.. _Installation: Installation
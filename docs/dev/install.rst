Developer Setup
===============
The following describes how to set up an instance of the site on your
computer for development.

Prerequisites
-------------
This guide assumes you have already installed and set up the following:

1. Git_
2. `Python 3.5`_, `pip 8`_ or higher, and virtualenv_
3. `Node.js`_ and npm.
4. `Postgres 9.4`_
5. ``openssl``

These docs assume a Unix-like operating system, although the site should, in
theory, run on Windows as well. All the example commands given below are
intended to be run in a terminal.

.. _Git: https://git-scm.com/
.. _Python 3.5: https://www.python.org/
.. _pip 8: https://pip.pypa.io/en/stable/
.. _Node.js: https://nodejs.org/en/
.. _virtualenv: https://virtualenv.pypa.io/en/latest/
.. _Postgres 9.4: http://www.postgresql.org/

Installation
------------
1. Clone this repository or your fork_:

   .. code-block:: bash

      git clone https://github.com/mozilla/normandy.git
      cd normandy

2. Create a virtualenv for Normandy and activate it:

   .. code-block:: bash

      virtualenv venv
      source ./venv/bin/activate

   .. note::

      Whenever you want to work on Normandy in a new terminal you'll have to
      re-activate the virtualenv. Read the virtualenv_ documentation to learn
      more about how virtualenv works.

3. Install the dependencies using pip:

   .. code-block:: bash

      pip install -r requirements.txt

   .. seealso::

      :ref:`pip-install-error`
         How to troubleshoot errors during ``pip install``.

4. Install pre-commit tools (optional)

   .. code-block:: bash

      therapist install

5. Install frontend dependencies and build the frontend code using npm:

   .. code-block:: bash

      npm install
      npm run build

6. Create a Postgres database for Normandy. By default it is assumed to be named
   ``normandy``:

   .. code-block:: bash

      createdb normandy

   .. note::

      If you use a different name for the database, or otherwise want to
      customize how you connect to the database, you may specify the database
      URL by adding the following to a ``.env`` file at the root of the repo:

      .. code-block:: ini

         DATABASE_URL=postgres://username:password@server_addr/database_name


7. Initialize your database by running the migrations:

   .. code-block:: bash

      python manage.py migrate

8. Create a new superuser account:

   .. code-block:: bash

      python manage.py createsuperuser

9. Pull the latest data on Firefox releases and supported locales with the
   ``update_product_details`` command:

   .. code-block:: bash

      python manage.py update_product_details

10. Pull the latest geolocation database using the ``download_geolite2.sh``
   script:

   .. code-block:: bash

      ./bin/download_geolite2.sh

11. Add some useful initial data to your database using the ``initial_data``
    command:

    .. code-block:: bash

       python manage.py initial_data

Once you've finished these steps, you should be able to start the site by
running:

.. code-block:: bash

   ./bin/runsslserver.sh

.. note::

   The ``runsslserver.sh`` command automatically creates a self-signed
   certificate in the ``etc/ssl`` directory of the repository. When viewing the
   site for the first time, you will have to create a certificate exception to
   allow Firefox to accept the certificate and access the site over HTTPS.

The site should be available at https://localhost:8000/admin/.

.. _peep: https://github.com/erikrose/peep/
.. _fork: http://help.github.com/fork-a-repo/
.. _issue: https://bugs.python.org/issue18378

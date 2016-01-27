Developer Setup
===============
The following describes how to set up an instance of the site on your
computer for development.

Prerequisites
-------------
This guide assumes you have already installed and set up the following:

1. Git_
2. `Python 3.5`_, `pip 8`_ or higher, and virtualenv_
3. `Postgres 9.4`_
4. ``openssl``

These docs assume a Unix-like operating system, although the site should, in
theory, run on Windows as well. All the example commands given below are
intended to be run in a terminal.

.. _Git: https://git-scm.com/
.. _Python 2.7: https://www.python.org/
.. _pip 8: https://pip.pypa.io/en/stable/
.. _virtualenv: https://virtualenv.pypa.io/en/latest/
.. _Postgres 9.4: http://www.postgresql.org/

Installation
------------
1. Clone this repository or your fork_:

   .. code-block:: bash

      git clone --recursive https://github.com/mozilla/normandy.git
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

   .. note::

      If you get an error like `pip: error: no such option: --hash`, you are
      using too old a version of Pip. Please upgrade to Pip 8 or above.

      If you get an error like this, the solution is harder::

         THESE PACKAGES DO NOT MATCH THE HASHES FROM THE REQUIREMENTS FILE. If you have
         updated the package versions, please update the hashes. Otherwise, examine the
         package contents carefully; someone may have tampered with them.
            alabaster==0.7.7 from https://pypi.python.org/packages/py2.py3/a/alabaster/alabaster-0.7.7-py2.py3-none-any.whl
                Expected sha256 d57602b3d730c2ecb978a213face0b7a16ceaa4a263575361bd4fd9e2669a544
                      Got        xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

      Normandy pins requirements with both a package version, and also a package
      hash. This gives reproducibility in builds. If you are sure that there is
      a good reason for your packages to have a different hash, add another hash
      line to requirements.txt for the requirement in question, like this::

         alabaster==0.7.7 \
            --hash d57602b3d730c2ecb978a213face0b7a16ceaa4a263575361bd4fd9e2669a544 \
            --hash xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

      A good reason for the hash to be different is if you use a platform that
      isn't covered by the existing hashes for a package that has wheels.


4. Create a Postgres database for Normandy. By default it is assumed to be named
   ``normandy``:

   .. code-block:: bash

      createdb normandy

   .. note::

      If you use a different name for the database, or otherwise want to
      customize how you connect to the database, you may specify the database
      URL by adding the following to a ``.env`` file at the root of the repo:

      .. code-block:: ini

         DATABASE_URL=postgres://username:password@server_addr/database_name


5. Initialize your database by running the migrations:

   .. code-block:: bash

      python manage.py migrate

6. Create a new superuser account:

   .. code-block:: bash

      python manage.py createsuperuser

7. Pull the latest data on Firefox releases and supported locales with the
   ``update_product_details`` command:

   .. code-block:: bash

      python manage.py update_product_details

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

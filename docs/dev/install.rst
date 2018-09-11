Developer Setup
===============
The following describes how to set up an instance of the site on your
computer for development.

Prerequisites
-------------
This guide assumes you have already installed and set up the following:

1. Git_
2. `Python 3.6`_, `pip 8`_ or higher, and virtualenv_
3. `Node.js 8`_ and NPM 5.
4. `Postgres 9.4`_
5. ``openssl``

These docs assume a Unix-like operating system, although the site should, in
theory, run on Windows as well. All the example commands given below are
intended to be run in a terminal.

.. _Git: https://git-scm.com/
.. _Python 3.6: https://www.python.org/
.. _pip 8: https://pip.pypa.io/en/stable/
.. _Node.js 8: https://nodejs.org/en/
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

      pip install -r requirements/default.txt

   .. seealso::

      :ref:`pip-install-error`
         How to troubleshoot errors during ``pip install``.

4. Install frontend dependencies using yarn_
   and build the frontend code using npm:

   .. code-block:: bash

      yarn install
      npm run build

.. _yarn: https://yarnpkg.com/lang/en/docs/install/

5. Create a Postgres database for Normandy. By default it is assumed to be named
   ``normandy``:

   .. code-block:: bash

      createdb normandy

   .. note::

      By default, it will connect to ``localhost`` using the global ``postgres``
      user. If you use a different name for the database, or otherwise want to
      customize how you connect to the database, you may specify the database
      URL by adding the following to a ``.env`` file at the root of the repo:

      .. code-block:: ini

         DATABASE_URL=postgres://username:password@server_addr/database_name


6. Initialize your database by running the migrations:

   .. code-block:: bash

      python manage.py migrate

7. Create a new superuser account:

   .. code-block:: bash

      python manage.py createsuperuser

8. Pull the latest geolocation database using the ``download_geolite2.sh``
   script:

   .. code-block:: bash

      ./bin/download_geolite2.sh

9. Load actions into the database:

   .. code-block:: bash

      python manage.py update_actions

10. Load in initial data:

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

The site should be available at https://localhost:8000/.

.. _fork: http://help.github.com/fork-a-repo/
.. _issue: https://bugs.python.org/issue18378

Autograph
---------
If you want to execute recipes on your local instance using the recipe
client, you'll need to set up Autograph_ to sign recipes as you save them:

1. Follow the `Autograph installation instructions`_ to launch a development
   instance of Autograph.

2. Add the following configuration to ``.env`` (create the file
   if it does not exist yet):

   .. code-block:: ini

      DJANGO_AUTOGRAPH_URL=http://localhost:8765/
      DJANGO_AUTOGRAPH_HAWK_ID=normandev
      DJANGO_AUTOGRAPH_HAWK_SECRET_KEY=3dhoaupudifjjvm7xznd9bn73159xn3xwr77b61kzdjwzzsjts

With the configuration in place, you should see log messages when saving recipes
that look like this::

   INFO 2017-05-01 19:58:04,274 normandy.recipes.models Requesting signatures for recipes with ids [16] from Autograph
   INFO 2017-05-01 19:58:04,301 normandy.recipes.utils Got 1 signatures from Autograph

.. _Autograph: https://github.com/mozilla-services/autograph
.. _Autograph installation instructions: https://github.com/mozilla-services/autograph#installation

.. _therapist-install:

Therapist
---------
If you want to automatically enforce Normandy code style guidelines, you can
use the `Therapist`_ pre-commit hook. To install Therapist, simply run:

.. code-block:: bash

      pip install therapist

After that, you should be able to run
the following to set up the git pre-commit hook:

.. code-block:: bash

      therapist install

After that, whenever you make a new commit Therapist will check the changed
code. This will save time when submitting pull requests.

If you want Therapist to attempt to automatically fix linting issues you can
install the hook using:

.. code-block:: bash

      therapist install --fix

If you ever need to bypass Therapist, you can do so by passing
``--no-verify`` to your ``git commit`` command.

.. _Therapist: http://therapist.readthedocs.io/en/latest/overview.html

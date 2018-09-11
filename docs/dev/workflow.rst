Workflow
========
The following is a list of things you'll probably need to do at some point while
working on Normandy.

Running Tests
-------------
You can run the automated test suite with the following command:

.. code-block:: bash

   py.test

In Python, to run the tests with code coverage run the following commands:

.. code-block:: bash

   pip install pytest-coverage
   py.test --cov-report html --cov-report term-missing --cov normandy
   open htmlcov/index.html

Front-end JavaScript tests can be run with:

.. code-block:: bash

   karma start

Linting
-------
You will need to :ref:`install Therapist <therapist-install>` for linting. If
you have installed pre-commit hook linting will take place with every commit,
however there may be times you want to run the linters manually.

To run the linters on all files that you have changed or added:

.. code-block:: bash

   therapist use lint

To run the linters on all files in the repo:

.. code-block:: bash

   therapist use lint:all

To run the linters and attempt to fix issues in files that you have changed or
added:

.. code-block:: bash

   therapist use fix

To run the linters and attempt to fix issues in all files in the repo:

.. code-block:: bash

   therapist use fix:all

Updating Your Local Instance
----------------------------
When changes are merged to the main Normandy repository, you'll want to update
your local development instance to reflect the latest version of the site. You
can use Git as normal to pull the latest changes, but if the changes add any new
dependencies or alter the database, you'll want to install any new libraries and
run any new migrations.

If you're unsure what needs to be run, it's safe to just perform all of these
steps, as they don't affect your setup if nothing has changed:

.. code-block:: bash

   # Pull latest code (assuming you've already checked out master).
   git pull origin master

   # Install new dependencies or update existing ones.
   pip install -r requirements/default.txt
   yarn install

   # Run database migrations.
   python manage.py migrate

   # Add any new action data (does not duplicate data).
   python manage.py update_actions

   # Update any new basic data (does not duplicate data).
   python manage.py initial_data

   # Build frontend files
   ./node_modules/.bin/webpack --config ./webpack.config.js --env.update-actions

Building the Documentation
--------------------------
You can build the documentation with the following command:

.. code-block:: bash

   # Enter the docs/ subdirectory
   cd docs
   make html

After running this command, the documentation should be available at
``docs/_build/html/index.html``.

Adding New Dependencies
-----------------------
Normandy uses hashed requirements for all of our dependencies. This means that
``requirements/default.txt`` includes hashes that help verify that dependencies
downloaded by pip haven't been tampered with.

When adding a new dependency, you must include hashes for it. For packages that
use wheels, you will have to include hashes for all of the platforms that the
wheel supports, as they will all have different hashes. Tools like hashin_ can
make adding these hashes easier.

Dependency's dependencies should go in ``requirements/constraints.txt``.

.. _hashin: https://github.com/peterbe/hashin

.. _process-webpack:

Preprocessing Assets with Webpack
---------------------------------
We use Webpack_ to create asset bundles of static resources. You can build an
asset bundle by running:

.. code-block:: bash

   npm run build

You can also run the watch command to automatically rebuild your bundles as you
make changes:

.. code-block:: bash

   npm run watch

Running the command with ``--env.update-actions`` will automatically call
``manage.py update_actions`` when action code is built. Arguments are separated
from the rest of the command by ``--``:

.. code-block:: bash

   npm run watch -- --env.update-actions

.. _Webpack: http://webpack.github.io/

Self-Repair Setup
-----------------
.. note:: Self-repair has been removed from recent versions of Firefox and is
   disabled by the Shield system add-on.

Normandy has a self-support-compatible endpoint. If you want to test out using
Normandy as a self-support server, you can point Firefox to it by setting the
``browser.selfsupport.url`` value in ``about:config`` to
``https://localhost:8000/%LOCALE%/repair``.

You can also do this to test development and staging servers; simply replace
``localhost:8000`` in the URL above with the URL for the server you wish to test
against.

After changing the setting, close and reopen Firefox, and after a 5 second
delay, Firefox will download and execute actions from the server you pointed it
to.

UITour Whitelist
----------------
Actions that use UITour_ (such as Heartbeat surveys) require you to add the URL
for the Normandy instance to a whitelist in ``about:config``.

To do this, open up ``about:config`` and search for a value named
``browser.uitour.testingOrigins``. If it doesn't exist, create it by
right-clicking the page and selecting ``New -> String``. The preference should
be set to a comma-separated list of server addresses, including the protocol.
For example, ``https://localhost:8000,https://normandy.dev.mozaws.net`` would
whitelist both local instances and the development server.

After creating this value, restart Firefox and UITour actions should function
normally.

.. _UITour: http://bedrock.readthedocs.org/en/latest/uitour.html

Adding and Updating Actions
---------------------------
The code and argument schemas for Actions is stored on the filesystem, but must
also be updated in the database to be used by the site.

To add a new action:

1. Create a new directory in ``normandy/recipes/static/actions`` containing a
   ``package.json`` file for your action and the JavaScript code for it.
2. Add the entry point for your action to ``webpack.config.js``.
3. Add the action name and path to the ``ACTIONS`` setting in ``settings.py``.
4. :ref:`Build the action code using Webpack <process-webpack>`.
5. Update the database by running ``update_actions``:

.. code-block:: bash

   python manage.py update_actions

To update an existing action, follow steps 4 and 5 above after making your
changes.

Redux DevTools
--------------
The control interface includes the `Redux DevTools`_ in development mode to help
debug issues. To toggle the DevTools, hit ``Ctrl-H``. You can change the side of
the screen the tools are docked on using ``Ctrl-Q``, and can resize the tools by
dragging the edge of the bar.

.. _Redux DevTools: https://github.com/gaearon/redux-devtools

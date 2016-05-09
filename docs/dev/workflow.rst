Workflow
========
The following is a list of things you'll probably need to do at some point while
working on Normandy.

Running Tests
-------------
You can run the automated test suite with the following command:

.. code-block:: bash

   py.test

Front-end JavaScript tests can be run with:

.. code-block:: bash

   karma start

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
   pip install -r requirements.txt
   npm install

   # Run database migrations.
   python manage.py migrate

   # Add any new initial data (does not duplicate data).
   python manage.py initial_data

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
``requirements.txt`` includes hashes that help verify that dependencies
downloaded by pip haven't been tampered with.

When adding a new dependency, you must include hashes for it. For packages that
use wheels, you will have to include hashes for all of the platforms that the
wheel supports, as they will all have different hashes. Tools like hashin_ can
make adding these hashes easier.

.. _hashin: https://github.com/peterbe/hashin

Preprocessing Assets with webpack
-----------------------

We use webpack to create asset bundles of static resources. You can build an
asset bundle by running:

.. code-block:: bash

   ./node_modules/.bin/webpack --config ./webpack.config.js

Running the command with ``--watch`` will automatically rebuild your bundles as
you make changes.

Self-Repair Setup
-----------------
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

Generating an API Key
---------------------
To generate an API key for privillaged API access:

1. Sign in to the admin interface.
2. Click the "AuthToken -> Token" link on the index page.
3. Click the "Add Token" button.
4. Select the user account you wish to generate a key for in the user list
   dropdown and click the Save button.
5. Retrieve the API token from the list view under the "Key" column.

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

JavaScript tests can be run with:

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

   # Update product details (does not duplicate data).
   python manage.py update_product_details

   # Update any new basic data (does not duplicate data).
   python manage.py initial_data

   # Build frontend files
   yarn build

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
We use Webpack_ to create asset bundles of static resources. These assets are
only used for legacy actions, and can be ignored if you aren't working with
Firefox clients older than Firefox 66. You can build an asset bundle by
running:

.. code-block:: bash

   yarn build

You can also run the watch command to automatically rebuild your bundles as you
make changes:

.. code-block:: bash

   yarn watch

Running the command with ``--env.update-actions`` will automatically call
``manage.py update_actions`` when action code is built.

.. code-block:: bash

   yarn watch --env.update-actions

.. _Webpack: http://webpack.github.io/

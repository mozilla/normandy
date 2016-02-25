Workflow
========
The following is a list of things you'll probably need to do at some point while
working on Normandy.

Running Tests
-------------
You can run the automated test suite with the following command:

.. code-block:: bash

   py.test

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

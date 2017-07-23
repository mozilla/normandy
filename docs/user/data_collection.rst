Data Collection
===============
This document describes the types of data that Shield collects.

Uptake
------
Shield monitors the execution of :ref:`recipes <recipes>` and reports to
`Firefox Telemetry`_ the amount of successful and failed runs. This data is
reported using `Uptake Telemetry`_ under the ``shield-recipe-client`` namespace.

.. _Firefox Telemetry: https://wiki.mozilla.org/Telemetry
.. _Uptake Telemetry: http://gecko.readthedocs.io/en/latest/toolkit/components/telemetry/telemetry/collection/uptake.html

Runner Status
^^^^^^^^^^^^^
Once per-fetch and execution of recipes, one of the following statuses is
reported under the key ``shield-recipe-client/runner``:

.. js:data:: RUNNER_INVALID_SIGNATURE

   Shield failed to verify the signature of the fetched recipes.

.. js:data:: RUNNER_NETWORK_ERROR

   There was a network-related error while fetching recipes.

.. js:data:: RUNNER_SERVER_ERROR

   The data returned by the server when fetching the recipe is invalid in some
   way.

.. js:data:: RUNNER_SUCCESS

   The operation completed successfully. Individual failures with actions and
   recipes may have been reported separately.

Action Status
^^^^^^^^^^^^^
For each :ref:`action <actions>` available from the Shield service, one of the
following statuses is reported under the key
``shield-recipe-client/action/<action name>``:

.. js:data:: ACTION_NETWORK_ERROR

   There was a network-related error while fetching actions

.. js:data:: ACTION_PRE_EXECUTION_ERROR

   There was an error while running the pre-execution hook for the action.

.. js:data:: ACTION_POST_EXECUTION_ERROR

   There was an error while running the post-execution hook for the action.

.. js:data:: ACTION_SERVER_ERROR

   The data returned by the server when fetching the action is invalid in some
   way.

.. js:data:: ACTION_SUCCESS

   The operation completed successfully. Individual failures with recipes may
   be reported separately.

Recipe Status
^^^^^^^^^^^^^
For each recipe that is fetched and executed, one of the following statuses is
reported under the key ``shield-recipe-client/recipe/<recipe id>``:

.. js:data:: RECIPE_ACTION_DISABLED

   The action for this recipe failed in some way and was disabled, so the recipe
   could not be executed.

.. js:data:: RECIPE_EXECUTION_ERROR

   An error occurred while executing the recipe.

.. js:data:: RECIPE_INVALID_ACTION

   The action specified by the recipe was invalid and it could not be executed.

.. js:data:: RECIPE_SUCCESS

   The recipe was executed successfully.

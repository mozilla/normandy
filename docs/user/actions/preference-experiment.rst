preference-experiment: Temporarily Change a Preference
======================================================
The ``preference-experiment`` action temporarily changes a preference in order
to test the effects of the change.

Users who match ``preference-experiment`` recipes are assigned to one of several
experiment branches, each with an assigned value for the preference. During the
experiment, Telemetry_ pings are annotated with a list of active experiments,
allowing us to measure the effect the preference change has on existing
Telemetry metrics.

.. note::

   Users may be enrolled in multiple preference experiments at the same time.

.. warning::

   Preference experiments are designed to expire, and are not appropriate for
   permanent preference changes.

.. _Telemetry: https://wiki.mozilla.org/Telemetry

Preference Filters
------------------
Preference experiments save the value of preferences before changing them, but
often you may want to respect users who have already modified the preference
you're testing. Preference studies allow you to do this in :doc:`filters
</user/filters>`:

.. code-block:: javascript

   // Do not match clients with a user-set value for name.of.preference
   !('name.of.preference'|preferenceIsUserSet)

Disqualification
----------------
Any of the following conditions will prevent a user from being enrolled in an
experiment, regardless of other filters:

- The user does not have a version of the SHIELD client which supports
  preference experiments.
- The user has previously participated in an experiment with the same ID.
- The user is already in an active experiment for the same preference.
- The preference value type in the recipe does not match the type of the
  preference in the user's profile, e.g. a boolean preference experiment for a
  preference with an integer value in the user's profile.

Branches
--------
Users are randomly assigned to a branch based on the ratio of the branch.
Branch ratios define the ratio of users that will be assigned to the branch as
compared to other branches. For example, consider four branches:

- Branch A; Ratio 4
- Branch B; Ratio 3
- Branch C; Ratio 2
- Branch D; Ratio 1

Given the above, twice as many users will be assigned to branch A as branch C.
Because the ratios total to 10, overall, 40% of matched users will be assigned
to branch A, 30% to branch B, and so on.

For completely random, equal assignment, set the ratio for each branch to 1.

Telemetry Annotation
--------------------
While an experiment is running, the `Telemetry Environment`_ contains a list of
experiment IDs, as well as the branch that the user has been assigned to. This
environment is sent along with the `main ping`_, among others.

.. code-block:: json

   {
     "environment": {
       "experiments": {
         "<experiment id>": { "branch": "<branch>" },
         "<experiment id>": { "branch": "<branch>" }
       }
     }
   }

.. _Telemetry Environment: https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/index.html
.. _main ping: https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/data/main-ping.html

Experiment End Conditions
-------------------------
Any of the following events will cause the experiment to end:

- If the recipe is disabled, or if its filters no longer match the user, the
  experiment will end the next time recipes are executed. The preference will be
  reset to the value it had before the experiment.
- If the user modifies the preference being tested, the experiment will end and
  the preference will not be reset to the value it had before the experiment.

Arguments
---------
Slug
   A unique identifier for this experiment. Users may only participate in an
   experiment with the same slug once.
Experiment Document URL
   An unused field for saving a link to an experiment document that describes
   the experiment that a recipe implements.
Preference Name
   The full dotted-path of the preference to modify.
Preference Type
   The type of the preference to modify. If this doesn't match the type on the
   client, the experiment will not enroll anyone.
Preference Branch Type
   Preference values can be saved on one of two branches: The **user** branch,
   or the **default** branch. Values on the user branch supersede values on the
   default branch.

   Most of the time, you want to use the **default** branch. If you understand
   the preference system in more detail, there are a few situations where you
   may want to use the **user** branch:

   - You want to modify a preference that is read before add-ons are
     initialized; default preference experiments do not modify the
     preference until the SHIELD system add-on starts.
   - You want to modify a preference that is generally user-set by the browser
     itself (user-set means that the value does not match the default, not that
     the user has manually set the value).

   In general, it is not recommended to use the user branch unless it is
   necessary.
Branches
   A list of experiment branches, each with the following arguments:

   Slug
      A unique identifier for the branch.
   Value
      Value to set the preference to for users that are assigned to this branch.
   Ratio
      Ratio of users to assign to this branch in comparison to other branches
      within the experiment.

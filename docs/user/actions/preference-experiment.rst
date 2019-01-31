preference-experiment: Temporarily Change a Preference
======================================================
The ``preference-experiment`` action temporarily changes a preference in order
to test the effects of the change.

Users that run ``preference-experiment`` recipes are assigned to one of
several experiment branches, each with an assigned value for the preference.
During the experiment, Telemetry_ pings are annotated with a list of active
experiments, allowing us to measure the effect the preference change has on
existing Telemetry metrics. When a user is enrolled or unenrolled in
preference experiments, Telemetry events are sent.

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

- Their :ref:`opt-out preference` is set to ``false``.
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

Additionally, `Telemetry Events`_ are sent that mark the enrollment and
unenrollment of clients.

.. _Telemetry Environment: https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/index.html
.. _main ping: https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/data/main-ping.html
.. _Telemetry Events: https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/collection/events.html

Experiment End Conditions
-------------------------
Any of the following events will cause the experiment to end:

- If the recipe is disabled, or if its filters no longer match the user, the
  experiment will end the next time recipes are executed. The preference will
  be reset to the value it had before the experiment.
- If the user (or another system in Firefox) modifies the preference being
  tested, the experiment will end immediately and the preference will not be
  reset to the value it had before the experiment.

Arguments
---------
Slug (sometimes called "Experiment Name")
   A unique identifier for this experiment. Users may only participate in an
   experiment with the same slug once. Slugs should consist only of lower
   case letters, numbers, and hypens.
Experiment Document URL
   A field for saving a link to an experiment document that describes the
   experiment that a recipe implements. This is often a link to a Bugzilla
   bug. This URL is not used anywhere except in the admin interface.
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

   - You want to modify a preference that is read before Normandy is
     initialized, and which is not updated on change. Default preference
     experiments have the old value during very early Firefox startup.
   - You want to modify a preference that is generally user-set by the browser
     itself (user-set means that the value does not match the default, not that
     the user has manually set the value).

   In general, it is not recommended to use the user branch unless it is
   necessary.
High volume recipes
   This changes the kind of telemetry sent, so that it is not picked up by
   automated systems that are not designed to handle very high amounts of
   traffic. This field should be set for any experiment targeting more than
   1% of the Release channel, or similarly sized populations of other
   channels.
Prevent New Enrollment
   When checked, new participants will not be enrolled in the experiment, and
   existing participants will continue to run the experiment. When unchecked,
   new participants will continue to be enrolled based on the recipe filters.
   This is useful to prevent an experiment's population from growing while
   still collecting additional data from the users already enrolled.
Branches
   A list of experiment branches, each with the following arguments:

   Slug
      A unique identifier for the branch.
   Value
      Value to set the preference to for users that are assigned to this branch.
   Ratio
      Ratio of users to assign to this branch in comparison to other branches
      within the experiment.

.. _preference-rollout:

preference-rollout: Permanently Change a Preference
===================================================
The ``preference-rollout`` action permanently changes a preference in order
to deploy a proven feature to most or all users of Firefox.

Users who match ``preference-rollout`` have values changed to match the
configuration of the recipe. While the change is active, Telemetry_ pings are
annotated to note that the rollout is changing a value to a non-default
value. This allows us to measure the effect the preference change has on
existing Telemetry metrics.

Rollouts do not support branching, and are intended to be permanent. If there
is a mistake, a rollback can be undone with a :ref:`preference-rollback
action <preference-rollback>`.

.. note::

   Users may be enrolled in multiple preference rollouts at the same time.

.. warning::

   Preference experiments are designed to be permanent. They are not
   appropriate for temporary changes.

.. _Telemetry: https://wiki.mozilla.org/Telemetry

Telemetry Annotation
--------------------
While an experiment is running, the `Telemetry Environment`_ contains a list
of "experiment" IDs. This field is also used to mark other non-default
changes, such as rollouts. environment is sent along with the `main ping`_,
among others.

.. code-block:: json

   {
     "environment": {
       "experiments": {
         "<rollout id>": { "branch": "<branch>" },
       }
     }
   }

.. _Telemetry Environment: https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/index.html
.. _main ping: https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/data/main-ping.html

Graduation
----------
Rollouts expect that eventually the value of the preference built in to
Firefox will change to match the value of the rollout. This generally happens
when Firefox updates to a new version that has the preferences updated. When
this happens, the preference rollout **graduates**. Once a rollout graduates,
it stops asserting the value of the preference at startup. If the default
value then changes again, Normandy will not change it back to the rollout
value.

Arguments
---------
Slug
   A unique identifier for this rollout. This is used for server and
   telemetry identification of the rollout.
Preferences
   A list of preferences to change, each with the following arguments:

   Name
      The full dotted-path of the preference to modify.
   Type
      The type of the preference to modify. If this doesn't match the type on
      the client, the rollout will not apply to anyone.
   Value
      Value to set the preference to for users that are assigned to this
      branch.

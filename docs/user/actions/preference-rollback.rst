.. _preference-rollback:

preference-rollback: Undo a preference rollback
===================================================
The ``preference-rollback`` action undoes the effects a
:ref:`preference-rollout action <preference-rollout>`. that did not go as
planned.

Users who run a ``preference-rollback`` have preferences reverted to their
original values, prior to the rollout being undone.

A preference rollback and its corresponding rollout cannot both be active at
once. This invariant is enforced by the Normandy server. Once a rollback
happens, the same rollout should never be re-enabled. Further changes to the
same preference should happen in a new recipe with a new slug.

.. note::

   Preference rollouts are actually permanent. Once a rollback runs on a
   client, the corresponding rollout can never be run on that client again.
   Any new changes need to be in a new rollout recipe.

Arguments
---------
Rollout Slug
   The unique identifier of the rollout to rollback. This must already exist.

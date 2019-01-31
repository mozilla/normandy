Peer Approval
=============

Recipes can only be enabled once they are approved by going through a peer
approval process. This process requires two separate users to be completed.

.. note::

   On some test versions of Normandy, notable the staging server, the approval
   process can be completed with a single user to ease testing of recipes and
   the Firefox client.

Workflow
--------

New recipe
^^^^^^^^^^

1. A user creates a new recipe.

2. The user requests approval for the new recipe.

  * If changes are made to the recipe after an approval request is created,
    this approval request will be closed automatically and a new approval
    request will need to be created for the latest changes.

3. Another user reviews the changes and either approves or rejects these
   changes.

  * If the changes were approved the recipe is now marked as approved and
    can be enabled.
  * If the changes were rejected the recipe must be updated before approval
    can be requested again.

4. A user enables the recipe.

Changes to approved recipes
^^^^^^^^^^^^^^^^^^^^^^^^^^^

1. A user makes a change to a recipe that has already been approved.

  * The change is now saved as a draft and the published recipe details do
    not change.

2. The user requests approval for the new recipe.

3. Another user reviews the changes and either approves or rejects these
   changes.

  * If the changes were approved the published recipe details will be updated
    to match the latest approved changes.

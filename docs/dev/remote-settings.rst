.. _remote-settings:

Remote Settings
===============

Remote Settings is a Mozilla service that makes it easy to manage evergreen settings data in Firefox.

When enabled on the Normandy server, the enabled recipes are published as Remote Settings records.

When enabled on the client side, instead of polling regularly the Normandy API to obtain the list of recipes, the recipes are read from the Remote Settings synchronized data locally.

Delivering Normandy recipes via Remote Settings allows us:

- Unify the way we obtain fresh data from our services in Firefox
- Get rid of the specific data channel of Normandy
- Get rid of the specific content signature integration
- Get rid of specific client code that fetches recipes from the server
- Unify the way we track uptake telemetry, network errors
- Speed up uptake
- Benefit from Remote Settings push notifications (live update)
- Reduce bandwidth using diff-based updates


Server to Server Integration
----------------------------

When a recipe is enabled, it is published and becomes visible
on the Remote Settings server:

.. code-block:: bash

      curl ${SERVER}/buckets/main/collections/normandy-recipes/records

When a recipe is disabled, its related record gets deleted.


Manual Synchronization
----------------------

A command allows to synchronize the enabled recipes with the records on the Remote Settings server.

.. code-block:: bash

   python manage.py sync_remote_settings

Use ``--dry-run`` to only print out the result of the synchronization.


Client side
-----------

The Normandy client integration was introduced in Firefox 66 (`Bug 1506175 <https://bugzilla.mozilla.org/show_bug.cgi?id=1506175>`_)
and can be enabled by flipping this preference:

- ``app.normandy.remotesettings.enabled``: ``true``

And then trigger a manual synchronization in the Browser console:

.. code-block:: javascript

      const { RemoteSettings } = ChromeUtils.import("resource://services-settings/remote-settings.js", {});
      await RemoteSettings.pollChanges();

.. seealso::

    * `Client setup with a local Remote Settings server <https://remote-settings.readthedocs.io/en/latest/tutorial-local-server.html#prepare-the-client>`_

The Normandy recipe runner will now be able to read the list of recipes to execute from the local Remote Settings database.

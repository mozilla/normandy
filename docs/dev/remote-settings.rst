.. _remote-settings:

Remote Settings
===============

Remote Settings is a Mozilla service that makes it easy to manage evergreen
settings data in Firefox.

As of Firefox 68, Normandy uses Remote Settings to serve/update its
recipes. This allows us to:

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

A command allows to synchronize the enabled recipes with the records on the
Remote Settings server.

.. code-block:: bash

   python manage.py sync_remote_settings

Use ``--dry-run`` to only print out the result of the synchronization.


Client side
-----------

The Normandy client integration was added in Firefox 66 (`Bug 1506175
<https://bugzilla.mozilla.org/show_bug.cgi?id=1506175>`_), refined through
Firefox 67 and 68 (`Bug 1538248
<https://bugzilla.mozilla.org/show_bug.cgi?id=1538248>`_) and turned on by
default in Firefox 68 (`bug 1513854
<https://bugzilla.mozilla.org/show_bug.cgi?id=1513854>`_).

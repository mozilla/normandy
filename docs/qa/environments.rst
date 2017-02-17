Environments
============
Mozilla runs several instances of Normandy; this document provides information
about each one of them, including what preferences you need to set to point an
instance of Firefox towards them

Production
----------
Production is the live, user-facing instance of Normandy that is hit by every
active user of Firefox.

- **Server URL:** https://self-repair.mozilla.org/
- **Control Interface:** https://normandy-admin.prod.mozaws.net/control/

Preferences
~~~~~~~~~~~
Set the following preferences to have Firefox execute recipes from the
production server:

.. describe:: extensions.shield-recipe-client.api_url

   ``https://self-repair.mozilla.org/api/v1``

.. describe:: security.content.signature.root_hash

   ``97:E8:BA:9C:F1:2F:B3:DE:53:CC:42:A4:E6:57:7E:D6:4D:F4:93:C2:47:B4:14:FE:A0:36:81:8D:38:23:56:0E``

Staging
-------
Staging is a test environment used to test the deployment process. It is useful
for testing a version of Normandy before it is deployed to users, but is not
guaranteed to be functional or available at all times.

- **Server URL:** https://normandy.stage.mozaws.net/
- **Control Interface:** https://normandy-admin.stage.mozaws.net/control/

Preferences
~~~~~~~~~~~
Set the following preferences to have Firefox execute recipes from the staging
server:

.. describe:: extensions.shield-recipe-client.api_url

   ``https://normandy.stage.mozaws.net/api/v1``

.. describe:: security.content.signature.root_hash

   ``DB:74:CE:58:E4:F9:D0:9E:E0:42:36:BE:6C:C5:C4:F6:6A:E7:74:7D:C0:21:42:7A:03:BC:2F:57:0C:8B:9B:90``

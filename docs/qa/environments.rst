Environments
============
Mozilla runs several instances of Normandy; this document provides information
about each one of them, including what preferences you need to set to point an
instance of Firefox towards them

Each environment may have several hostnames associated with it. Generally,
there is a public, read-only server, a legacy admin server, a new Bearer
auth admin server, and an API CDN. Not all environments have all of these.

Production
----------
Production is the live, user-facing instance of Normandy that is hit by every
active user of Firefox.

- **Read-only server:** https://normandy.services.mozilla.com/
- **API CDN:** https://normandy.cdn.mozilla.net/
- **Legacy admin:** https://normandy-admin.prod.mozaws.net/ (VPN Required)
- **Bearer auth admin:** https://normandy-admin-bearer.prod.mozaws.net/ (VPN Required)

For new usage, the API CDN server is preferred for read-only usages, and the
Bearer auth server is preferred for read-write usages.

Preferences
~~~~~~~~~~~
Set the following preferences to have Firefox execute recipes from the
production server:

.. describe:: app.normandy.api_url

   ``https://normandy.cdn.mozilla.net/api/v1``

.. describe:: security.content.signature.root_hash

   ``97:E8:BA:9C:F1:2F:B3:DE:53:CC:42:A4:E6:57:7E:D6:4D:F4:93:C2:47:B4:14:FE:A0:36:81:8D:38:23:56:0E``

Staging
-------
Staging is a test environment used to test the deployment process. It is useful
for testing a version of Normandy before it is deployed to users, but is not
guaranteed to be functional or available at all times.

- **Read-only server:** https://normandy.stage.mozaws.net/
- **Legacy admin:** https://normandy-admin.stage.mozaws.net/ (VPN Required)
- **Bearer auth admin:** https://normandy-admin-bearer.stage.mozaws.net/ (VPN Required)

Staging does not have a API CDN.

Preferences
~~~~~~~~~~~
Set the following preferences to have Firefox execute recipes from the staging
server:

.. describe:: app.normandy.api_url

   ``https://normandy.stage.mozaws.net/api/v1``

.. describe:: security.content.signature.root_hash

   ``DB:74:CE:58:E4:F9:D0:9E:E0:42:36:BE:6C:C5:C4:F6:6A:E7:74:7D:C0:21:42:7A:03:BC:2F:57:0C:8B:9B:90``

Dev
---
Dev is an environment that deploys automatically from the master branch. It can be used
for testing admin frontends to Normandy, and always has the latest  code. Sometimes it
is broken. Dev doesn't have a separate read-only and admin server, there is only one
server.

- **Legacy admin:** https://normandy.dev.mozaws.net/
- **Bearer auth admin:** https://normandy-admin-bearer.dev.mozaws.net/

Dev does not have a separate read-only server, nor an API CDN. None of its server
require VPN to access.

Preferences
~~~~~~~~~~~
Set the following preferences to have Firefox execute recipes from the dev
server:

.. describe:: app.normandy.api_url

   ``https://normandy.dev.mozaws.net/api/v1``

.. describe:: security.content.signature.root_hash

   TODO: The value is currently unknown. It would be the root hash used for Autograph
   development servers.

Local
-----
This section is for an instance of normandy you are running yourself, such as by
following the instructions in this set of docs, or by running a Docker container.

These environments don't always have Autograph set up, but when they do, the
hash to use is the one below. It is possible to configure Autograph to use
different keys than the default ones provided for Normandy. That is a not a
supported configuration for local development.

The server run this way works as both a bearer auth server, and can be used
with local Django authentication. It is not generally configured to use the
legacy authentication method, though that is possible as well.

Preferences
~~~~~~~~~~~
Set the following preferences to have Firefox execute recipes from a typical
local server:

.. describe:: app.normandy.api_url

   ``https://localhost:8000/api/v1``

   Note that the Normandy API must be accessed via HTTPS, even for local
   development.

.. describe:: security.content.signature.root_hash

   ``4C:35:B1:C3:E3:12:D9:55:E7:78:ED:D0:A7:E7:8A:38:83:04:EF:01:BF:FA:03:29:B2:46:9F:3C:C5:EC:36:04``
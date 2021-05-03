ADR 0002 - Syncing data to Firefox with Remote Settings
=======================================================

* Status: retrospective
* Last Updated: 2021-05-03

.. note::

  This is a *retrospective* ADR, that documents a past decision well after
  the time the decision was actually made. It's accuracy may be limited by
  the distance in time between the decision and the time of record.

Context and Problem Statement
-----------------------------

Normandy maintains a collection of recipes, and Firefox needs to access this
collection periodically to determine if any of the recipes are applicable to
that instance of Firefox. How should Firefox sync the collection of recipes
from Normandy Server?

Decision Drivers
----------------

* The collection of recipes changes slowly, and so refetching the entire
  collection every time is wasteful.
* It is important to have up-to-date versions of the recipes, so the update
  interval should be relatively short.
* Updates to the collection of recipes should be secure.

Considered Options
------------------

1. Fetch all recipes from Normandy via an HTTP request each run
2. Implement a smart syncing system that would only download changed recipes
3. Process recipe filters on the server, reducing the data that clients download
4. Use Remote Settings to sync recipes to Firefox

Decision Outcome
----------------

Chosen option: "option 4", Use Remote Settings. This option provides
efficient updates without sacrificing update frequency or user privacy, and
is a wise use of our limited development resources, since it re-uses existing
tools. Ultimately it provided a better product, after some additional
engineering work.

Positive Consequences
~~~~~~~~~~~~~~~~~~~~~

As a result of using Remote Settings to synchronize data to clients,
Normandy's servers have lighter load, clients have less to download, and
uptake is faster thanks to Remote Settings's push notification support.
Additionally, Normandy helped design some changes to Remote Settings that
make server-to-server work loads better. Additionally, Normandy served as an
example for other Remote Settings integration, including as an inspiration
for Nimbus's sync model.

Negative Consequences
~~~~~~~~~~~~~~~~~~~~~

Switching to Remote Settings was not without its growing pains. There were
several problems relating to the push notification system. When clients
updated recipes in relation to a push service, they would often overwhelm
various services, including Normandy's Classify-Client (which got rewritten
in Rust for performance), Telemetry (rate limiting was added to mitigate
this), and Remote Settings itself (caching bugs were revealed and fixed).

Additionally, this adds another layer of indirection that can make tracking
down issues more complicated. When unexpected behavior is found, there is
another system to consider.

Pros and Cons of the Options
----------------------------

1. Fetch all recipes from Normandy via an HTTP request each run
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This is the behavior that Normandy was originally designed, built, and ran
for several years with. All active recipes are listed with the needed details
in a single API endpoint that clients can fetch, and each client calls this
endpoint every time it processes Normandy recipes.

* Good, because it is proven to work in real world uses cases for several years.
* Good, because it gives Normandy more control over its syncing process.
* Bad, because it produces higher load on the servers than needed.
* Bad, because clients needlessly redownload data multiple times.
* Bad, because a service interruption causes client side issues, ranging from
  wasted resources and retries to experiment failure.

2. Implement a smart syncing system
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Clients could keep track of a last modified timestamp, or some other system
that could allow them to communicate their sync state to the server. The
server would then send them only changed recipes.

* Good, because it reduces the amount of data transferred.
* Good, because Normandy don't have to rely on a new outside services.
* Bad, because it is a complicated system to implement on both server and client side.
* Bad, because it re-invents a system already accessible in Firefox.

3. Process recipes on the server
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Instead of download all recipes and filtering them locally, clients would
assemble a filtering context and then send it to the server. The server would
evaluate the filter rules of each recipe, and then reply to the client with
only the relevant recipes.

* Good, because it reduces the amount of data transferred (though doesn't
  entirely deduplicate those transfers).
* Good, because it simplifies the execution model of Normandy, giving us more
  insight and control into the system.
* Bad, because it either reduces our filtering capabilities, or requires
  sending more sensitive data to Normandy.
* Bad, because it is more expensive to host. It requires increased
  per-request-processing and responses are not very cacheable with current
  filter criteria.

4. Use Remote Settings to sync recipes
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Normandy server would maintain a Remote Settings collection with all active
recipes. Clients would use the existing Remote Settings protocol to
efficiently synchronize data between the server and a local store.

* Good, because less data is transferred.
* Good, because it uses pre-existing components that are already well tested.
* Good, because at the time, Remote Settings and Normandy were managed by the same team.
* Good, because we can push-notifications.
* Bad, because it increases the complexity of the system.

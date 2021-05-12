ADR 0002 - How to validate Normandy data in Remote Settings
===========================================================

* Status: retrospective
* Last Updated: 2021-05-07

.. note::

  This is a *retrospective* ADR, that documents a past decision well after
  the time the decision was actually made. It's accuracy may be limited by
  the distance in time between the decision and the time of record.


Context and Problem Statement
-----------------------------

..
  Describe the context and problem statement, e.g., in free form using two to
  three sentences. You may want to articulate the problem in form of a
  question.

Normandy supports two methods of getting recipe data to Firefox clients.

1. The original system of making all recipes available via an HTTP API.
   Clients refetch all recipes every time they sync.
2. The newer system based on Remote Settings. Normandy updates Remote
   Settings as recipes change, and clients fetch only changed records from
   Remote Settings. See `ADR 0001 <./adr-0001-content-signing.html>`_ for
   more details.

Normandy and Remote Settings sign their data differently. Remote Settings
signs the entire collection as a single object. Normandy signs each recipe
individually.

It is not obvious how signing and verification should work for clients
syncing through Remote Settings.

Decision Drivers
----------------

* Remote Settings signatures are only validated when synchronizing.

  * 2021 Note: Remote Settings now offers a way to validate signatures on
    demand, but did not when this decision was made.

* Normandy re-validates signatures every time recipes are processed on the
  client.
* Both Normandy and Remote Settings use Autograph to sign data.
* Normandy recipes are a vector for attacking Firefox.
* The new sync method is a change to Firefox that will take some time to
  saturate the user base. The old system will need to be maintained for some
  time.

Considered Options
------------------

1. Use only Remote Settings signatures
2. Use both Remote Settings signatures and Normandy signatures
3. Don't use Remote Settings at all

Decision Outcome
----------------

Chosen option: Option 2, "Use both Remote Settings and Normandy signatures",
because it is a relatively small amount of extra work, and Normandy
signatures have desirable security features that Remote Settings's signatures
do not.

Positive Consequences
~~~~~~~~~~~~~~~~~~~~~

* This allowed us to use the same recipe format for both kinds of clients
  without any additional work.
* This gave us protection against local attackers modifying Remote Settings's
  store on disk.
* This was one of the motivating example that lead to Remote Settings
  eventually adding verify on demand functionality.
* Defense in depth: An attacker would have to compromise both Normandy and
  Remote settings to attack Firefox via Normandy recipes.

Negative Consequences
~~~~~~~~~~~~~~~~~~~~~

* The long term version of the system, that doesn't support legacy clients,
  seems weirdly paranoid.
* The long term version of the system has more parts to maintain.

Pros and Cons of the Options
----------------------------

Option 1 - Use only Remote Settings signatures
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For Firefox clients that support Remote Settings sync, don't do any further
signature verification after receiving signatures from Remote Settings. Trust
that Remote Settings signatures are sufficient.

* Good, because it is a simpler system.
* Good, because it makes Normandy more similar to other systems that use Remote
  Settings.
* Bad, because Remote Settings does not re-verify recipes that are on disk.

  * 2021 Note: This can now be overridden.

* Bad, because it makes the migration from the old recipe sync system to the
  new one a larger step.
* Bad, because it makes the old and new server systems less similar.

Option 2 - Use both Remote Settings signatures and Normandy signatures
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Continue to sign Normandy recipes using Normandy's existing signature system,
and send both the recipe and the signature object using Remote Settings. The
collection as a whole will be verify by Remote Setting's signing
infrastructure, and the recipe individually will be verified by Normandy's
infrastructure.

* Good, because it provides additional defense in depth. More systems need to
  be compromised to send false recipes.
* Good, because it makes Normandy Server's two sync modes more similar to each
  other.
* Good, because it defends against recipes changing on-disk.
* Bad, because it is more complex than using only Remote Settings signatures.
* Bad, because it makes Normandy less similar to other services that use Remote
  Settings.

Don't use Remote Settings at all
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This is the status quo. It avoids the signing question entirely by simply not
using Remote Settings. See `ADR 0001 <./adr-0001-content-signing.html>`_ for
more details about this option.

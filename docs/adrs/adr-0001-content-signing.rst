ADR 0001 - Ensuring recipe integrity using Content Signature
============================================================

:Status: retrospective
:Last Updated: 2021-02-18

.. note::

  This is a *retrospective* ADR, that documents a past decision well after
  the time the decision was actually made. It's accuracy may be limited by
  the distance in time between the decision and the time of record.

Context and Problem Statement
-----------------------------

Normandy is a system to remotely control Firefox, and in that role is very
powerful. At its extreme, it can execute arbitrary code with some work via
extension installation, and change arbitrary preferences simply. This power
is very useful, but needs to be carefully managed to make sure that we don't
supply attackers with a ready made attack vector. This ADR covers one of the
techniques used to protect Firefox.

Decision Drivers
----------------

* Normandy has extremely powerful control over all Firefox clients.
* There should be protections to reduce the chance that an unintended recipe is
  executed.
* There are dozens of Normandy recipes potentially active at once, and they
  change frequently and in an uncoordinated way.
* Balrog, a system that Normandy is partially replacing in some ways, has
  signed payloads
* The recipes served may vary by client

  * 2021 Note: This ended up not being true for very long, but it did impact
    our decision.

* Extensions can run arbitrary chrome-privileged code.

  * 2021 Note: This decision was made before Web Extensions were mandatory.

* TLS intercepting middleboxes exist for a significant number of users.

Considered Options
------------------

1. Individual recipe signatures
2. HTTPS only
3. Whole-collection signatures
4. Response signing

Decision Outcome
----------------

Chosen option: Option 1, Individual recipe signatures. This option provides
strong security, and a good balance between handling frequent changes with
performance and compute cost.

Positive Consequences
~~~~~~~~~~~~~~~~~~~~~

In the years since we have made this decision, it has been a key factor in at
least one security incident, and has given us confidence that the recipes we
serve to clients are what we meant them to be.

Negative Consequences
~~~~~~~~~~~~~~~~~~~~~

Especially in the time when this feature was new, the signatures generated
would often become out of sync, invalid, or be generated with the wrong data.
This caused several experiments to outright fail, or to be compromised in
subtle ways. It required extra work for developers, ops, experiment owners,
and managers.

Pros and Cons of the Options
----------------------------

1. Individual recipe signatures
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Each recipe carries with it a signature that validates both the content and
the source of the data. The signature is over the byte representation of the
canonical JSON serialization of the recipe.

.. code-block:: json

  {
    "recipe": { ... },
    "signature": {
      "timestamp": "2021-02-12T19:25:36.504464Z",
      "signature": "7tlSH4_w5I4aKb_EDKggZK31fxmLI5c9LmoTBDfO5…",
      "x5u": "https://content-signature-2.cdn.mozilla.net/chains/..."
    }
  }


.. note::

  For the curious, "x5u" stands for "X.509 URI", which RFC 7515 defines as

    The "x5u" (X.509 URL) Header Parameter is a URI that refers to a resource
    for the X.509 public key certificate or certificate chain corresponding to
    the key used to digitally sign the [payload].

    -- https://tools.ietf.org/html/rfc7515#section-4.1.5

  The x5u is used to validate the source of the signature.

* Good, because spoofing a recipe is very difficult.
* Good, because recipes are valid for a limited amount of time, reducing the risk of replay attacks.
* Good, because signing a recipe can be separated in time from authoring a
  recipe, allowing for safer edits.
* Good, because we can verify that the data we are serving is correct.
* Good, because recipe signatures can in theory be valid or invalid alone,
  reducing single-point-of-failure.
* Good, because subsets of the recipe collection can be served.
* Bad, because it adds a dependent service, Autograph.
* Bad, managing recipe signatures is a complicated additional step that must be
  handled by the server.
* Bad, because canonical JSON serialization must be synchronized between client and server.


HTTPS Only
~~~~~~~~~~

Use only the protections provided by HTTPS. The contents of recipes would be
served from an API without any extra verification steps. The validity of the
origin and contents of the message would be entirely

* Good, because it requires no additional work.
* Good, because TLS is well understood.
* Good, because have a lot of experience running HTTPS servers.
* Bad, because there are far more trusted root TLS certs, none of which we control.

  * This could be mitigated by pinning a certificate for the service.

    * Good, because it provides more security.
    * Bad, because it makes the system more brittle, giving up some of HTTPS's simplicity.
* Bad, because it cannot protect against local attackers modifying data.

Whole-collection signatures
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Sign the entire collection as a single unit, and update the collection
signature when any recipe changes. This is the approach that Remote Settings
uses. The signature is over the byte representation of the JSON serialized,
sorted collection.

* Good, because spoofing a recipe set is very difficult.
* Good, because recipe sets are valid for a limited amount of time, reducing
  the risk of replay attacks.
* Good, because signing a recipe can be separated in time from authoring a
  recipe, allowing for safer edits.
* Bad, because we can verify that the data we are serving is correct.
* Bad, because it adds a dependent service, Autograph.
* Bad, managing collection signatures is a complicated additional step that
  must be handled by the server.
* Bad, because canonical JSON serialization must be synchronized between client and server.
* Bad, because a problem with the signature causes all recipes to fail

Response signing
~~~~~~~~~~~~~~~~

Dynamically sign responses in whole or part as they are served. This would
involve creating a new short lived signature for each unique request served
by Normandy.

* Good, because it could serve a subset of recipes.
* Good, because spoofing a recipe set is very difficult.
* Good, because recipes are valid for a limited amount of time, reducing the risk of replay attacks.
* Good, because signing a recipe can be separated in time from authoring a
  recipe, allowing for safer edits.
* Bad, because Autograph could not handle this kind of throughput.
* Bad, because it is harder to verify that ephemeral signatures are correct.
* Bad, because a problem with the signature causes all recipes to fail
* Bad, because it either adds a dependent service, Autograph, or adds cryptography to Normandy.
* Bad, because canonical JSON serialization must be synchronized between client and server.

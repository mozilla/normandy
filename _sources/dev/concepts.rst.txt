Concepts
========
Normandy is a system that allows Mozilla to instruct Firefox clients to
perform a variety of actions to aid the user and gather feedback to guide
Mozilla in developing a better browser for them. To do this, we need a way to
instruct Firefox to perform certain actions without having to download an
update or wait for a new release.

The system is made of two main components, a server and client. These
components are known simply as the Normandy client and Normandy server. The
server provides information that the client acts on.

Normandy's execution is built around two main concepts: Actions and Recipes. This
document describes those concepts in detail.

.. _actions:

Actions
-------
An action is one of the capabilities provided by Normandy. As of Firefox 66,
actions are implemented entirely within the browser as native code. Actions
are identified in recipes by name, such as "preference-experiment" or
"show-heartbeat".

Actions can accept a configuration object that is specified within the
Normandy control interface. This configuration, which is part of a
:ref:`recipe <recipes>`, contains data required by the action, such as
translated strings or boolean options for controlling behavior.

For example, a "survey" action could consist of code within Firefox to check
whether we have shown a survey to the user recently, to determine which
variant of a survey to show, and the code to actually display the survey
itself. When issued to clients, this action is paired with configuration for
the survey action would contain the text of the survey prompt and the URL to
redirect the user to after answering.

.. _recipes:

Recipes
-------
A recipe is a model that represents a single instance of an action we want to
perform. Recipes contain three important pieces of information:

1. Client filtering data that determines which users the recipe should be run
   for. This takes the form of a JEXL_ expression that is evaluated on the
   client and has access to several pieces of data about the client, such as
   the data collected by Telemetry_.
2. The name of the :ref:`action <actions>` that this recipe should perform
   when run.
3. The configuration data to pass to the Action code when it is executed, called
   the recipe's **arguments**.

Recipes are stored in the Normandy server's database and the Normandy client
fetches them from the service during execution. All active recipes are sent
to every client, and filtering is done locally on the client.

Here's an example of a recipe in JSON format, as fetched by the Normandy
client:

.. code-block:: json

   {
      "id": 1,
      "name": "Console Log Test",
      "revision_id": 12,
      "action": "console-log",
      "arguments": {
         "message": "It works!"
      },
      "filter_expression": "normandy.version >= '65.0' && stableSample(0.5)"
   }

.. note::

   The data retrieved by the Normandy client is the minimum subset of data
   that is needed execute the action. Other API end points return more
   information about the recipe, including it's history and approval status.

.. _JEXL: https://github.com/TechnologyAdvice/Jexl
.. _Telemetry: https://wiki.mozilla.org/Telemetry

.. _client:

Normandy Client
---------------
The Normandy client is `a Firefox component`_ that reads and executes
instructions from the server. Upon activation (typically every few hours),
the client:

1. Downloads :ref:`recipes <recipes>` from the Normandy service.
2. Verifies the signature of the recipes.
3. Evaluates the recipe filters and removes recipes that do not match the
   client.
4. Executes the corresponding action code using the recipe's arguments.

.. _a Firefox component: https://hg.mozilla.org/mozilla-central/file/tip/toolkit/components/normandy

Security Considerations
-----------------------
Since the goal of SHIELD is to allow Mozilla to perform certain privileged
actions quickly without shipping full updates to Firefox, it is a tempting
target for compromising Firefox users. Normandy includes several security
controls to help mitigate this risk.

Action and Recipe Signing
^^^^^^^^^^^^^^^^^^^^^^^^^
Recipes that are downloaded by the client are signed according to the
Content-Signature protocol as provided by the Autograph_ service. The client
verifies the signature upon downloading the recipes, ensuring that only
recipes that have been signed with a Mozilla-controlled key are executed.

This helps prevent Man-in-the-Middle attacks where an adversary pretends to be
the remote Normandy service.

.. _Autograph: https://github.com/mozilla-services/autograph

Peer Approval
^^^^^^^^^^^^^
Recipes cannot be enabled in the Normandy admin interface without going through
an `approval process </user/peer_approval>`. One user must submit the recipe
for approval, and a separate user must approve the recipe before it can be
distributed by the service.

This helps prevent compromise of a single account from compromising the entire
service, since two accounts need to be compromised to publish a recipe.

Safe Instructions
^^^^^^^^^^^^^^^^^
Recipe data is provided in either a non-executable format (JSON) or a safe
executable format designed specifically to be weak and without enough access
to exfiltrate data (JEXL filters). In technical terms, the JEXL filters are
not turing complete, by design. This means that even if an attacker could run
a malicious recipe in Firefox, they are limited to the actions implemented in
the existing client.

Configurable Admin
^^^^^^^^^^^^^^^^^^
The admin interface for Normandy can be disabled via a Django setting, which
allows for disabling the admin interface on public-facing web servers and
running them with read-only privileges. The writable admin interface is then
deployed behind a VPN to restrict access to authorized users.

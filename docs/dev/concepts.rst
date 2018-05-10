Concepts
========
Normandy is a component in a larger system called SHIELD. The end goal of
SHIELD is to allow Firefox to perform a variety of actions to aid the user and
gather feedback to guide Mozilla in developing a better browser for them. To do
this, we need a way to instruct Firefox to perform certain actions without
having to download an update or wait for a new release.

SHIELD is split into three main concepts: Actions, Recipes, and the runtime.
This document describes those concepts in detail.

.. _actions:

Actions
-------
An action is JavaScript code that describes a process to perform within a user's
browser. The code is designed to run in a sandbox that has no privileged access
to the rest of the browser except through a :doc:`driver object </dev/driver>`
that has a constrained API for performing sensitive actions, such as showing a
survey to a user or getting information about the browser itself.

Actions can accept a configuration object that is specified within the Normandy
control interface. This configuration, which is part of a
:ref:`recipe <recipes>`, contains static data required by the action, such as
translated strings or boolean options for controlling behavior.

For example, a survey action would include code to check whether we have showed
a survey to the user recently, to determine which variant of a survey to show,
and the call to the driver to actually display the survey itself. The
configuration for the survey action would contain the text of the survey prompt
and the URL to redirect the user to after answering.

Actions are stored in the Normandy code repository and the
:ref:`runtime <runtime>` fetches the actions from the Normandy service during
execution. Here's an example of an action that logs a message to the console:

.. code-block:: javascript

   export default class ConsoleLogAction {
     constructor(normandy, recipe) {
       this.normandy = normandy; // The driver object
       this.recipe = recipe; // Contains recipe arguments and other data
     }

     // Actions should return a Promise when executed
     async execute() {
       this.normandy.log(this.recipe.arguments.message, 'info');
     }
   }

   // registerAction is in the sandbox's global object
   registerAction('console-log', ConsoleLogAction);

.. _recipes:

Recipes
-------
A recipe is a model that represents a single instance of an action we want to
perform. Recipes contain three important pieces of information:

1. Client filtering data that determines which users the recipe should be run
   for. This takes the form of a JEXL_ expression that is evaluated on the
   client and has access to several pieces of data about the client, such as the
   data collected by Telemetry_.
2. A pointer to the :ref:`action <actions>` that this recipe should perform when
   run.
3. The configuration data to pass to the Action code when it is executed, called
   the recipe's **arguments**.

Recipes are stored in the Normandy database and the :ref:`runtime <runtime>`
fetches them from the service during execution. Here's an example of a recipe in
JSON format as returned by Normandy:

.. code-block:: json

   {
      "id": 1,
      "name": "Console Log Test",
      "revision_id": 12,
      "action": {
         "name": "console-log",
         "implementation_url": "https://normandy.cdn.mozilla.net/api/v1/action/console-log/implementation/8ee8e7621fc08574f854972ee77be2a5280fb546/",
         "arguments_schema": {
            "$schema": "http://json-schema.org/draft-04/schema#",
            "description": "Log a message to the console",
            "type": "object",
            "properties": {
               "message": {
                  "default": "",
                  "description": "Message to log to the console",
                  "type": "string",
               }
            },
            "required": [
               "message"
            ],
         }
      },
      "arguments": {
         "message": "It works!"
      }
   }

Note that the recipe as returned by the API also contains data about the action,
including a schema describing the arguments field.

.. _JEXL: https://github.com/TechnologyAdvice/Jexl
.. _Telemetry: https://wiki.mozilla.org/Telemetry

.. _runtime:

Runtime
-------
The runtime is an execution environment that can affect a running instance of
Firefox. Upon activation (typically a few moments after Firefox launches), the
runtime:

1. Downloads :ref:`recipes <recipes>` from the Normandy service.
2. Verifies the signature of the recipes.
3. Evaluates the recipe filters and filters out recipes that do not match the
   client the runtime is installed within.
4. Downloads the :ref:`actions <actions>` for the remaining recipes.
5. Executes the action code for each recipe in a sandbox, passing in the
   arguments from the recipe, and a :doc:`driver object </dev/driver>` containing
   methods that can perform privileged actions.

The runtime is implemented as `a component of Firefox in mozilla-central`_.

.. _a component of Firefox in mozilla-central: https://hg.mozilla.org/mozilla-central/file/tip/toolkit/components/normandy

Threat Model
------------
Since the goal of SHIELD is to allow Mozilla to perform certain privileged
actions quickly without shipping full updates to Firefox, it is a tempting
target for compromising Firefox users. Normandy includes several security
controls to help mitigate this risk.

Action and Recipe Signing
^^^^^^^^^^^^^^^^^^^^^^^^^
Actions and recipes that are downloaded by the runtime are signed according to
the Content-Signature protocol as provided by the autograph_ service. The
runtime verifies the signature upon downloading the recipes and actions,
ensuring that the runtime only executes recipes that have been signed with a
Mozilla-controlled key.

This helps prevent Man-in-the-Middle attacks where an adversary pretends to be
the remote Normandy service.

.. _autograph: https://github.com/mozilla-services/autograph

Peer Approval
^^^^^^^^^^^^^
Recipes cannot be enabled in the Normandy admin interface without going through
an `approval process </user/peer_approval>`. One user must submit the recipe
for approval, and a separate user must approve the recipe before it can be
distributed by the service.

This helps prevent compromise of a single account from compromising the entire
service, since two accounts need to be compromised to publish a recipe.

Action Sandbox
^^^^^^^^^^^^^^
Actions are executed within a JavaScript sandbox by the runtime. The sandbox
limits the access of the JavaScript to prevent it from modifying Firefox in ways
that haven't been reviewed and approved beforehand.

To perform actions that JavaScript normally can't (such as displaying a
Heartbeat survey), the action in the sandbox is passed a
:doc:`driver object </dev/driver>`, which contains methods that can modify the
client or trigger other privileged behavior.

Configurable Admin
^^^^^^^^^^^^^^^^^^
The admin interface for Normandy can be disabled via a Django setting, which
allows for disabling the admin interface on public-facing web servers and
running them with read-only privileges. The writable admin interface is then
deployed behind a VPN to restrict access to authorized users.

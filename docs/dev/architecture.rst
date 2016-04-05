Architecture
============
Normandy is a component in a larger system called SHIELD. The end goal of
SHIELD is to allow Firefox to perform a variety of actions to aid the user and
gather feedback to guide us in developing a better browser for them. To do
this, we need a way to instruct Firefox to perform certain actions without
having to download an update or wait for a new release.

To accomplish this goal, the SHIELD system consists of:

Normandy
   Service that acts as the source of actions that we wish to perform, and
   determines which users receive which recipes.
Self-Repair System Addon
   Ships with Firefox and handles fetching recipes and action implementations
   from Normandy and executing them within Firefox.

.. note:: Normandy provides both the names of actions and, separately,
   implementations for them to be used in self-repair executors. Other Firefox
   features may also query Normandy and implement the actions however they
   wish, although they are recommended to use the implementations that
   Normandy provides if possible.

Normandy / Self-Repair Protocol
-------------------------------
The following section describes the protocol used to communicate between
Normandy and clients in Firefox that execute Self-Repair recipes. The domain
``shield.mozilla.org`` is used as a stand-in domain; the actual domain Normandy
is hosted at may be different.

.. warning:: The following documentation is still in flux and does not describe
   a live system yet. Expect the protocol to change.

Retrieving Recipes
^^^^^^^^^^^^^^^^^^
The Self-Repair addon retrieves a recipe bundle by making an HTTP POST request
to the URL::

   https://shield.mozilla.org/api/v1/fetch_bundle/

The request should contain a JSON object of the form:

.. code-block:: json

   {
      "locale": "en-US",
      "version": "42.0.1",
      "release_channel": "release",
      "user_id": "bd3ece30-ddb1-46ce-b3e9-c2816e59103f"
   }

The API will respond with a JSON object containing metadata the server
calculated (such as location), and a list of recipes. Each recipe will include
a link to the JS implementation of the action for that recipe, an arguments
schema, the arguments to pass to the implementation, and metadata about the
action.

.. code-block:: json

   {
      "country": "US",
      "recipes": [
         {
            "id": 1,
            "name": "Console Log Test",
            "revision_id": 12,
            "action": {
               "name": "console-log",
               "implementation_url": "https://shield.mozilla.org/api/v1/action/console-log/implementation/8ee8e7621fc08574f854972ee77be2a5280fb546/",
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
      ]
   }

Retrieving an Action
^^^^^^^^^^^^^^^^^^^^
The Self-Repair addon retrieves the code necessary to execute an action by
making an HTTP GET to the URL provided in the ``implementation_url`` property
of an action. The response is the JavaScript code for the requested action.

Legacy Self-Repair
------------------
Normandy also hosts an endpoint so that it can replace the predecessor
Self-Repair server, which delivers a single HTML page for Firefox to execute.

Firefox currently retrieves the HTML page at the URL::

   https://self-repair.mozilla.org/en-US/repair/

Which returns an HTML page roughly of the form:

.. code-block:: html

   <!DOCTYPE html>
   <html lang="en">
      <head>
         <meta charset="utf-8">
      </head>
      <body>
         <script>/* Code to retrieve and execute recipes and actions. */</script>
      </body>
   </html>

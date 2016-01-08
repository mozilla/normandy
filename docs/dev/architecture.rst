Architecture
============
Normandy is a component in a larger system called SHIELD. The end goal of SHIELD
is to allow Firefox to perform a variety of actions to aid the user and gather
feedback to guide us in developing a better browser for them. To do this, we
need a way to instruct Firefox to perform certain actions without having to
download an update or wait for a new release.

To accomplish this goal, the SHIELD system consists of:

Normandy
   Service that acts as the source of actions that we wish to perform, and
   determines which users receive which recipes.
Self-Repair System Addon
   Ships with Firefox and handles fetching recipes and action implementations
   from Normandy and executing them within Firefox.

.. note:: Normandy provides both the names of actions and, separately,
   implementations for them to be used in the self-repair system addon. Other
   Firefox features may also query Normandy and implement the actions however
   they wish, and are not required to use the implementations that Normandy
   provides.

Normandy / Self-Repair Protocol
-------------------------------
The following section describes the protocol used to communicate between
Normandy and the Self-Repair system addon. The domain ``shield.mozilla.org``
is used as a stand-in domain; the actual domain Normandy is hosted at may be
different.

.. warning:: The following documentation is still in flux and does not describe
   a live system yet. Expect the protocol to change.

Retrieving Recipes
^^^^^^^^^^^^^^^^^^
The Self-Repair addon retrieves a list of recipes by making an HTTP POST request
to the URL::

   https://shield.mozilla.org/api/v1/fetch_bundle

The request should contain a JSON object of the form:

.. code-block:: json

   {
      "locale": "en-US",
      "firefox_version": "42.0.1"
   }

The API will respond with a JSON object:

.. code-block:: json

   {
      "recipes": [
         {
            "name": "heartbeat.australis.1",
            "actions": [
               {
                  "name": "show_survey",
                  "selfRepairImpl": {
                     "hash": "4011cf569f3639b9069fc2c50117d3f8597e83c61be2014081ad06ee0fe427c2",
                     "url": "https://shield.mozilla.org/api/v1/actions/show_survey/"
                  },
                  "arguments": {
                     "url": "https://somesurvey.com/blah"
                  }
               }
            ]
         },
         {
            "name": "remove.bad.toolbar",
            "actions": [
               {
                  "name": "check_for_bad_toolbar",
                  "selfRepairImpl": {
                     "hash": "4011cf569f3639b9069fc2c50117d3f8597e83c61be2014081ad06ee0fe427c2",
                     "url": "https://shield.mozilla.org/api/v1/actions/check_for_bad_toolbar/"
                  },
                  "arguments": {
                     "toolbar_name": "Shady Tim's Totally Legit Search"
                  }
               },
               {
                  "name": "telemetry_ping",
                  "impl_hash": "4011cf569f3639b9069fc2c50117d3f8597e83c61be2014081ad06ee0fe427c2",
                  "arguments": {
                     "id": "shady_tim_strikes_again"
                  }
               }
            ]
         }
      ]
   }

Retrieving an Action
^^^^^^^^^^^^^^^^^^^^
The Self-Repair addon retrieves the code necessary to execute an action by
making an HTTP GET to the URL::

   https://shield.mozilla.org/api/v1/get_action_impl?name=action_name

The API will respond with a JSON object of the form:

.. code-block:: json

   {
      "impl": "function action(selfRepairAPI, args) { /* Do something */ }"
   }

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
         <script>/* Do something */</script>
      </body>
   </html>

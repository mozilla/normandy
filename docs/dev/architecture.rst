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
Self-Repair Client
   Ships with Firefox and handles fetching recipes and action implementations
   from Normandy and executing them within Firefox.

Self-Repair Protocol
--------------------
The following section describes how Firefox retrieves and executes recipes from
Normandy.

.. image:: /resources/self-repair-sequence.png
   :width: 460
   :height: 535
   :align: center

When Firefox is launched by a user, it makes the following series of requests:

1. First, a ``GET`` request to ``https://self-repair.mozilla.org/en-US/repair``.
   The ``en-US`` part of the URL differs depending on the locale that Firefox
   was built for.

   The server returns an HTML page that loads the JavaScript for the self-repair
   shim. This JavaScript triggers and processes all other requests in the
   sequence.

2. Next, a ``POST`` to ``https://self-repair.mozilla.org/api/v1/fetch_bundle/``.
   This request includes client info, such as the client's update channel, and
   the response contains a list of recipes that should be run on the client.

3. Finally, a series of ``GET`` requests to URLs like
   ``https://self-repair.mozilla.org/api/v1/action/action-name/implementation/SHA1_HASH/``
   are sent to fetch the JavaScript code for each action to be executed. The
   ``SHA1_HASH`` part of the URL unsurprisingly contains a SHA1 hash of the
   JavaScript code being fetched.

.. http:get:: /(str:locale)/repair

   Returns an HTML page that performs the rest of the self-repair dance for
   fetching and executing recipes.

   :param string locale:
      Locale code for the Firefox client in use.
   :query boolean testing:
      If included, activates "testing mode", which alters the behavior of some
      recipes to make testing easier.

.. http:post:: /api/v1/fetch_bundle/

   Retrieves recipes that should be executed by the client based on filtering
   rules specified in the Normandy admin interface.

   :<json string locale:
      Locale code for the Firefox client in use.
   :<json string version:
      The client's Firefox version.
   :<json string release_channel:
      The release channel Firefox is currently set to.
   :<json string user_id:
      A v4 UUID used to provide stable sampling. If a recipe is sampled at 10%,
      this UUID helps ensure the same 10% of users consistently receive that
      recipe.

   :>json string country:
      Geolocated country code for the client based on their IP address.
   :>json array recipes:
      List of recipes that have been matched to the user.

   **Example response**:

   .. sourcecode:: json

      {
         "country": "US",
         "recipes": [
            {
               "id": 1,
               "name": "Console Log Test",
               "revision_id": 12,
               "action": {
                  "name": "console-log",
                  "implementation_url": "https://self-repair.mozilla.org/api/v1/action/console-log/implementation/8ee8e7621fc08574f854972ee77be2a5280fb546/",
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

.. http:get:: /api/v1/action/(string:action_name)/implementation/(string:action_hash)/

   Retreives the JavaScript code for executing an action.

   :param string action_name:
      Unique slug for the action being requested.
   :param string action_hash:
      SHA1 hash of the action code being requested.
   :status 200:
      When the action code is found and the hash matches it.
   :status 404:
      If no action could be found with the given ``action_name``, or if the
      given ``action_hash`` does not match the stored JavaScript.

Example
=======
This document describes the end-to-end process of developing, shipping, and
executing a new action with SHIELD, in order to illustrate in detail the
mechanics of the system.

In this example, we want to add the ability to SHIELD to prompt users with a
pop-up notification with some configurable text, and only prompts users once.

1. Adding a Function to the Driver
----------------------------------
The first step is to add a new function to the :doc:`driver </dev/driver>` that
will trigger the notification on the client. The driver is implemented in the
system add-on, so we update the add-on to implement the function:

.. js:function:: showNotification(message)

   Display a pop-up notification to the user.

   :param message: Message to show in the pop-up.

The change has to be merged into the system add-on and released before it will
be available to actions to use.

2. Write a Notification Action
------------------------------
Next, we must develop an :ref:`action <actions>` that uses ``showNotification``
to display the notification given in the action's arguments. This includes the
logic for only showing the notification if the user hasn't seen it before:

.. code-block:: javascript

   export default class NotificationAction {
     constructor(normandy, recipe) {
       this.normandy = normandy; // The driver object
       this.recipe = recipe; // Contains recipe arguments and other data

       // Persistent data store on the client.
       this.storage = normandy.createStorage(recipe.id);
     }

     async execute() {
       // Check if we've shown the notification previously, and show it if we
       // have not.
       const haveShownPreviously = await this.storage.getItem('shownPreviously');
       if (!haveShownPreviously) {
         this.storage.setItem('shownPreviously', true);
         this.normandy.showNotification(this.recipe.arguments.message);
       }
     }
   }

   registerAction('notification', ConsoleLogAction);

.. note:: In addition to the code above, actions have to define a `JSON Schema`_
   as well as a form for the arguments. These are used in the control interface
   in Normandy as well as in the system add-on to validate arguments.

After creating the action, it must be deployed to the Normandy service before it
can be used in a recipe.

.. _JSON Schema: http://json-schema.org/

3. Create a Recipe
------------------
The next step is to create a :ref:`recipe <recipes>` that uses the
``notification`` action that we created above. This is done via the control
interface on the Normandy service itself. Important fields to input via the
web interface include:

- **Action**: The ``notification`` action.
- **Filter Expression**: A JEXL_ statement to filter the recipe so that only
  certain users see it. For testing purposes, the expression ``true`` will match
  all users.
- **Arguments**: A single ``message`` field containing the message to display.

Once created, the recipe will need to be submitted for peer review and approved
by another users before it is enabled within the service.

.. _JEXL: https://github.com/TechnologyAdvice/Jexl

4. Delivery
-----------
Once the recipe is enabled, the service will include it in queries to the
recipe API. The system add-on performs the following steps to fetch and execute
our new recipe:

1. Upon activation, send a ``POST`` request to ``/api/v1/recipe/?enabled=true``
   to retrieve all currently-enabled recipes. This returns a JSON response that
   looks similar:

   .. code-block:: json

      [
         {
              "id": 1,
              "name": "Notification",
              "enabled": true,
              "revision_id": 1,
              "action_name": "notification",
              "arguments": {
                  "message": "Notification message!"
              },
              "filter_expression": "true"
         }
      ]

   .. note:: Some fields were removed from the response above for readability.

2. For each recipe, evaluate its ``filter_expression`` field as a JEXL_
   expression against a context containing information about the client and
   environment that it is running in. If the expression returns true, then the
   recipe matches the client and will be run. Otherwise, the recipe is
   discarded.

   The ``/api/v1/classify_client/`` API endpoint is used to populate the context
   with the current server time and the country the user is located in via IP
   address geolocation.
3. For each matching recipe, download the action specified in the recipe if it
   hasn't been downloaded yet. Actions served from URLs of the form
   ``/api/v1/action/notification/`` and return a response that looks like:

   .. code-block:: json

      {
         "name": "show-heartbeat",
         "implementation_url": "https://normandy.cdn.mozilla.net/v1/action/notification/implementation/4574dbc126af07cd031a0da29d625a11365403ea/",
         "arguments_schema": {
               "$schema": "http://json-schema.org/draft-04/schema#",
               "title": "Display a pop-up notification",
               "type": "object",
               "required": [
                   "message"
               ],
               "properties": {
                   "message": {
                       "description": "Message to show in the notification",
                       "type": "string",
                       "default": ""
                   }
               }
           }
      }

   In addition, the JavaScript code for the action is downloaded via the URL in
   the ``implementation_url`` property of the response above.
4. For each matching recipe, execute the action associated with it in a sandbox,
   passing in information about the recipe (including its arguments) and the
   driver object.

After these steps, the ``notification`` action and recipe that we created will
have been downloaded and executed, and the user will see a notification pop up.
Future runs of that specific recipe will not show a notification.

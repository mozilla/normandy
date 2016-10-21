Driver API
==========
The Normandy driver is an object passed to all actions when they are created. It
provides methods and attributes for performing operations that require more
privileges than JavaScript is normally given. For example, the driver might
provide a function for showing a notification bar within the Firefox UI,
something normal JavaScript can't trigger.

Environments in which actions are run (such as the `Normandy system add-on`_)
implement the driver and pass it to the actions before executing them.

.. _Normandy system add-on: https://github.com/mozilla/normandy-addon

Driver
------
The driver object contains the following attributes:

.. js:data:: testing

   Boolean describing whether the action is being executed in "testing" mode.
   Testing mode is mainly used when previewing recipes within the Normandy
   admin interface.

.. js:data:: locale

   String containing the locale code of the user's preferred language.

.. js:function:: log(message, level='debug')

   Log a message to an appropriate location. It's up to the driver where these
   messages are stored; they could go to the browser console, or to a remote
   logging service, or somewhere else. If level is ``'debug'``, then messages
   should only be logged if ``testing`` is true.

   :param message: Message to log
   :param level: Level to log message at, such as ``debug``, ``info``, or
      ``error``. Defaults to ``debug``.

.. js:function:: showHeartbeat(options)

   Displays a Heartbeat survey to the user. Appears as a notification bar with
   a 5-star rating input for users to vote with. Also contains a "Learn More"
   button on the side. After voting, users are shown a thanks message and
   optionally a new tab is opened to a specific URL.

   :param message: Primary message to display alongside rating stars.
   :param engagementButtonLabel: Message to display on the engagement button.
      If specified, a button will be shown instead of the rating stars.
   :param thanksMessage: Message to show after user submits a rating.
   :param flowId: A UUID that should be unique to each call to this function.
      Used to track metrics related to this user interaction.
   :param postAnswerUrl: URL to show users after they submit a rating. If empty,
      the user won't be shown anything.
   :param learnMoreMessage: Text to show on the "Learn More" button.
   :param learnMoreUrl: URL to open when the "Learn More" button is clicked.
   :param surveyId: Extra data to be stored in telemetry.
   :param surveyVersion: Extra data to be stored in telemetry.
   :param testing: Extra data to be stored in telemetry when Normandy is in
      testing mode.
   :returns: A Promise that resolves with an event emitter.

   The emitter returned by this function can be subscribed to using ``on``
   method. For example:

   .. code-block:: javascript

      let heartbeat = await Normandy.showHeartbeat(options);
      heartbeat.on('NotificationOffered', function(data) {
         // Do something!
      });

   All events are given a data object with the following attributes:

   flowId
      The ``flowId`` passed into ``showHeartbeat``.
   timestamp
      Timestamp (number of milliseconds since Unix epoch) of when the event
      being emitted occurred.

   The events emitted by the emitter include:

   NotificationOffered
      Emitted after the notification bar is shown to the user.
   NotificationClosed
      Emitted after the notification bar closes, either by being closed
      manually by the user, or automatically after voting.
   LearnMore
      Emitted when the user clicks the "Learn More" link.
   Voted
      Emitted when the user clicks the star rating bar and submits a rating.
      An extra ``score`` attribute is included on the data object for this
      event containing the rating the user submitted.
   Engaged
      Emitted when the user clicks the engagement button. Only occurs if the
      ``engagementButtonLabel`` parameter was given when ``showHeartbeat`` was
      called.
   TelemetrySent
      Emitted after Heartbeat has sent flow data to the Telemetry servers. Only
      available on Firefox 46 and higher.

   .. note:: Individual events are only emitted once; if `on` is called after an
      event has already been emitted, the given callback will be called
      immediately.

.. js:function:: uuid()

   Generates a v4 UUID. The UUID is randomly generated.

   :returns: String containing the UUID.

.. js:function:: createStorage(keyPrefix)

   Creates a storage object that can be used to store data on the client.

   :param keyPrefix: Prefix to append to keys before storing them, to avoid
      collision with other actions using the storage.
   :returns: :js:class:`Storage`

.. js:function:: location()

   Retrieves information about where the user is located.

   :returns: A Promise that resolves with a location object.

   The location object has the following fields:

   countryCode
      ISO 3166-1 country code for the country the user has been geolocated to.

.. js:function:: saveHeartbeatFlow(data)

   Sends flow data from Heartbeat to the Input server. See the
   `Input documentation`_ for details about the data expected.

   :param data: Object containing Heartbeat flow data.

.. _Input Documentation: http://fjord.readthedocs.org/en/latest/hb_api.html

.. js:function:: client()

   Retrieves information about the user's browser.

   :returns: Promise that resolves with a client data object.

   The client data object includes the following fields:

   version
      String containing the Firefox version.
   channel
      String containing the update channel. Valid values include, but are not
      limited to:

      * ``'release'``
      * ``'aurora'``
      * ``'beta'``
      * ``'nightly'``
      * ``'default'`` (self-built or automated testing builds)

   isDefaultBrowser
      Boolean specifying whether Firefox is set as the user's default browser.
   searchEngine
      String containing the user's default search engine identifier.
   syncSetup
      Boolean containing whether the user has set up Firefox Sync.
   plugins
      An object mapping of plugin names to :js:class:`Plugin` objects describing
      the plugins installed on the client.
   distribution
      String containing the distribution ID of Firefox. This value is
      ``undefined`` on Firefox versions older than 48.0.

Plugins
-------
.. js:class:: Plugin

   A simple object describing a plugin installed on the client. This is **not**
   the same object as returned by ``navigator.plugins``, but it is similar.

   .. js:data:: name

      The name of the plugin.

   .. js:data:: description

      A human-readable description of the plugin.

   .. js:data:: filename

      The filename of the plugin file.

   .. js:data:: version

      The plugin's version number string.

Storage
-------
.. js:class:: Storage

   Storage objects allow actions to store data locally on the client, using an
   API that is similar to localStorage, but is asynchronous.

   .. js:function:: getItem(key)

      Retrieves a value from storage.

      :param key: Key to look up in storage.
      :returns: A Promise that resolves with the value found in storage, or
         ``null`` if the key doesn't exist.

   .. js:function:: setItem(key, value)

      Inserts a value into storage under the given key.

      :param key: Key to insert the value under.
      :param value: Value to store.
      :returns: A Promise that resolves when the value has been stored.

   .. js:function:: removeItem(key)

      Removes a value from storage.

      :param key: Key to remove.
      :returns: A Promise that resolves when the value has been removed.

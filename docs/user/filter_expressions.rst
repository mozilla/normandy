Filter Expressions
==================
Filter expressions describe which users a :ref:`recipe <recipes>` should be
executed for. They're executed locally in the client's browser and, if they
pass, the corresponding recipe is executed. Filter expressions have access to
information about the user, such as their location, locale, and Firefox version.

Filter expressions are written using a language called JEXL_. JEXL is an
open-source expression language that is given a context (in this case,
information about the user's browser) and evaluates a statement using that
context. JEXL stands for "JavaScript Expression Language" and uses JavaScript
syntax for several (but not all) of its features.

.. note:: The rest of this document includes examples of JEXL syntax that has
   comments inline with the expressions. JEXL does **not** have any support for
   comments in statements, but we're using them to make understanding our
   examples easier.

.. _JEXL: https://github.com/TechnologyAdvice/Jexl

JEXL Basics
-----------
The `JEXL Readme`_ describes the syntax of the language in detail; the following
section covers the basics of writing valid JEXL expressions.

.. note:: Normally, JEXL doesn't allow newlines or other whitespace besides
   spaces in expressions, but filter expressions in Normandy allow arbitrary
   whitespace.

A JEXL expression evaluates down to a single value. JEXL supports several basic
types, such as numbers, strings (single or double quoted), and booleans. JEXL
also supports several operators for combining values, such as arithmetic,
boolean operators, comparisons, and string concatenation.

.. code-block:: javascript

   // Arithmetic
   2 + 2 - 3 // == 1

   // Numerical comparisons
   5 > 7 // == false

   // Boolean operators
   false || 5 > 4 // == true

   // String concatenation
   "Mozilla" + " " + "Firefox" // == "Mozilla Firefox"

Expressions can be grouped using parenthesis:

.. code-block:: javascript

   ((2 + 3) * 3) - 3 // == 7

JEXL also supports lists and objects (known as dictionaries in other languages)
as well as attribute access:

.. code-block:: javascript

   [1, 2, 1].length // == 3
   {foo: 1, bar: 2}.foo // == 1

Unlike JavaScript, JEXL supports an ``in`` operator for checking if a substring
is in a string or if an element is in an array:

.. code-block:: javascript

   "bar" in "foobarbaz" // == true
   3 in [1, 2, 3, 4] // == true

The context passed to JEXL can be expressed using identifiers, which also
support attribute access:

.. code-block:: javascript

   normandy.locale == 'en-US' // == true if the client's locale is en-US

Another unique feature of JEXL is transforms, which modify the value given to
them. Transforms are applied to a value using the ``|`` operator, and may take
additional arguments passed in the expression:

.. code-block:: javascript

   '1980-01-07'|date // == a date object

.. _JEXL Readme: https://github.com/TechnologyAdvice/Jexl#jexl---

Context
-------
This section defines the context passed to filter expressions when they are
evaluated. In other words, this is the client information available within
filter expressions.

.. js:data:: normandy

   The ``normandy`` object contains general information about the client.

.. js:attribute:: normandy.userId

   A `v4 UUID`_ uniquely identifying the user. This is uncorrelated with any
   other unique IDs, such as Telemetry IDs.

   .. _v4 UUID: https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_.28random.29

.. js:attribute:: normandy.version

   **Example:** ``'47.0.1'``

   String containing the user's Firefox version.

.. js:attribute:: normandy.channel

   String containing the update channel. Valid values include, but are not
   limited to:

   * ``'release'``
   * ``'aurora'``
   * ``'beta'``
   * ``'nightly'``
   * ``'default'`` (self-built or automated testing builds)

.. js:attribute:: normandy.isDefaultBrowser

   Boolean specifying whether Firefox is set as the user's default browser.

.. js:attribute:: normandy.searchEngine

   **Example:** ``'google'``

   String containing the user's default search engine identifier. Identifiers
   are lowercase, and may by locale-specific (Wikipedia, for examnple, often has
   locale-specific codes like ``'wikipedia-es'``).

   The default identifiers included in Firefox are:

   * ``'google'``
   * ``'yahoo'``
   * ``'amazondotcom'``
   * ``'bing'``
   * ``'ddg'``
   * ``'twitter'``
   * ``'wikipedia'``

.. js:attribute:: normandy.syncSetup

   Boolean containing whether the user has set up Firefox Sync.

.. js:attribute:: normandy.syncDesktopDevices

   Integer specifying the number of desktop clients the user has added to their
   Firefox Sync account.

.. js:attribute:: normandy.syncMobileDevices

   Integer specifying the number of mobile clients the user has added to their
   Firefox Sync account.

.. js:attribute:: normandy.syncTotalDevices

   Integer specifying the total number of clients the user has added to their
   Firefox Sync account.

.. js:attribute:: normandy.plugins

   An object mapping of plugin names to :js:class:`Plugin` objects describing
   the plugins installed on the client.

.. js:attribute:: normandy.locale

   **Example:** ``'en-US'``

   String containing the user's locale.

.. js:attribute:: normandy.country

   **Example:** ``'US'``

   `ISO 3166-1 alpha-2`_ country code for the country that the user is located
   in. This is determined via IP-based geolocation.

   .. _ISO 3166-1 alpha-2: https://en.wikipedia.org/wiki/ISO_3166-1

.. js:attribute:: normandy.request_time

   Date object set to the time and date that the user requested recipes from
   Normandy. Useful for comparing against date ranges that a recipe is valid
   for.

   .. code-block:: javascript

      // Do not run recipe after January 1st.
      normandy.request_time < '2011-01-01'|date

.. js:attribute:: normandy.distribution

   String set to the user's distribution ID. This is commonly used to target
   funnelcake builds of Firefox.

   On Firefox versions prior to 48.0, this value is set to ``undefined``.

.. js:attribute:: normandy.telemetry

   Object containing data for the most recent Telemetry_ packet of each type.
   This allows you to target recipes at users based on their Telemetry data.

   The object is keyed off the ping type, as documented in the
   `Telemetry data documentation`_ (see the ``type`` field in the packet
   example). The value is the contents of the ping.

   .. code-block:: javascript

      // Target clients that are running Firefox on a tablet
      normandy.telemetry.main.environment.system.device.isTablet

      // Target clients whose last crash had a BuildID of "201403021422"
      normandy.telemetry.crash.payload.metadata.BuildID == '201403021422'

   .. _Telemetry: http://gecko.readthedocs.io/en/latest/toolkit/components/telemetry/telemetry/index.html
   .. _Telemetry data documentation: http://gecko.readthedocs.io/en/latest/toolkit/components/telemetry/telemetry/data/index.html

.. js:attribute:: normandy.doNotTrack

   Boolean specifying whether the user has enabled Do Not Track.

Transforms
----------
This section describes the transforms available to filter expressions, and what
they do. They're documented as functions, and the first parameter to each
function is the value being transformed.

.. js:function:: stableSample(input, rate)

   Randomly returns ``true`` or ``false`` based on the given sample rate. Used
   to sample over the set of matched users.

   Sampling with this transform is stable over the input, meaning that the same
   input and sample rate will always result in the same return value. The most
   common use is to pass in a unique user ID and a recipe ID as the input; this
   means that each user will consistently run or not run a recipe.

   Without stable sampling, a user might execute a recipe on Monday, and then
   not execute it on Tuesday. In addition, without stable sampling, a recipe
   would be seen by a different percentage of users each day, and over time this
   would add up such that the recipe is seen by more than the percent sampled.

   :param input:
      A value for the sample to be stable over.
   :param number rate:
      A number between ``0`` and ``1`` with the sample rate. For example,
      ``0.5`` would be a 50% sample rate.

   .. code-block:: javascript

      // True 50% of the time, stable per-user per-recipe.
      [normandy.userId, normandy.recipe.id]|stableSample(0.5)

.. js:function:: bucketSample(input, start, count, total)

   Returns ``true`` or ``false`` if the current user falls within a "bucket" in
   the given range.

   Bucket sampling randomly groups users into a list of "buckets", in this case
   based on the input parameter. Then, you specify which range of available
   buckets you want your sampling to match, and users who fall into a bucket in
   that range will be matched by this transform. Buckets are stable over the
   input, meaning that the same input will always result in the same bucket
   assignment.

   Importantly, this means that you can use a recipe-independent input across
   several recipes to ensure they do not get delivered to the same users. For
   example, if you have two survey recipes that are variants of each other, you
   can ensure they are not shown to the same people by using the
   :js:attr:`normandy.userId` attribute:

   .. code-block:: javascript

      // Half of all users will match the first filter and not the
      // second one, while the other half will match the second and not
      // the first, _even across multiple recipes_.
      [normandy.userId]|bucketSample(0, 5000, 10000)
      [normandy.userId]|bucketSample(5000, 5000, 10000)

   The range to check wraps around the total bucket range. This means that if
   you have 100 buckets, and specify a range starting at bucket 70 that is 50
   buckets long, this function will check buckets 70-99, and buckets 0-19.

   :param input:
      A value for the bucket sampling to be stable over.
   :param integer start:
      The bucket at the start of the range to check. Bucket indexes larger than
      the total bucket count wrap to the start of the range, e.g. bucket 110 and
      bucket 10 are the same bucket if the total bucket count is 100.
   :param integer count:
      The number of buckets to check, starting at the start bucket. If this is
      large enough to cause the range to exceed the total number of buckets, the
      search will wrap to the start of the range again.
   :param integer total:
      The number of buckets you want to group users into.

.. js:function:: date(dateString)

   Parses a string as a date and returns a Date object. Date strings should be
   in `ISO 8601`_ format.

   :param string dateString:
      String to parse as a date.

   .. code-block:: javascript

      '2011-10-10T14:48:00'|date // == Date object matching the given date

   .. _ISO 8601: https://www.w3.org/TR/NOTE-datetime

Examples
--------
This section lists some examples of commonly-used filter expressions.

.. code-block:: javascript

   // Match users using the en-US locale while located in India
   normandy.locale == 'en-US' && normandy.country == 'IN'

   // Match 10% of users in the fr locale.
   (
      normandy.locale == 'fr'
      && [normandy.userId, normandy.recipe.id]|stableSample(0.1)
   )

   // Match users in any English locale using Firefox Beta
   (
      normandy.locale in ['en-US', 'en-AU', 'en-CA', 'en-GB', 'en-NZ', 'en-ZA']
      && normandy.channel == 'beta'
   )

   // Only run the recipe between January 1st, 2011 and January 7th, 2011
   (
      normandy.request_time > '2011-01-01T00:00:00+00:00'|date
      && normandy.request_time < '2011-01-07T00:00:00+00:00'|date
   )

   // Match users located in the US who have Firefox as their default browser
   normandy.country == 'US' && normandy.isDefaultBrowser

   // Match users with the Flash plugin installed. If Flash is missing, the
   // plugin list returns `undefined`, which is a falsy value in JavaScript and
   // fails the match. Otherwise, it returns a plugin object, which is truthy.
   normandy.plugins['Shockwave Flash']

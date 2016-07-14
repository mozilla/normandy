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

   String containing the user's default search engine identifier.

.. js:attribute:: normandy.syncSetup

   Boolean containing whether the user has set up Firefox Sync.

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

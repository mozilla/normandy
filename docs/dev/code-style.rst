=====================
Code Style Guidelines
=====================

Goals
=====

* Uniformity in code
    * If you look at code and can tell who wrote it, that’s not good
* Rules should be automatable
* Code should be easy to read / understand

Rules
=====

Black Python formatting (uniformity)
------------------------------------

Normandy uses `Black`_ to format code. If you set up the :ref:`Therapist
<therapist-install>` pre-commit hook, it can handle formatting your code
automatically.

.. _Black: https://black.readthedocs.io/en/stable/

Commenting (uniformity)
-----------------------

Function documentation (jsdoc/docstrings)

.. code-block:: javascript

    /**
     * Given an option and its parent group, update the filter state based on the `isEnabled` prop
     *
     * @param  {Object}  group
     * @param  {Object}  option
     * @param  {Boolean} isEnabled
     */
    function selectFilter({ group, option, isEnabled }) {
      return {
        type: group.value === 'text' ? SET_TEXT_FILTER : SET_FILTER,
        group,
        option,
        isEnabled,
      };
    }

**Rule: Use full width for wrapping comments (80-100 chars)**

**Rule: JSDoc: Param descriptions only if needed**

.. code-block:: javascript

    /**
     * Given an option and its parent group, update the filter state based on the `isEnabled` prop
     */
    function selectFilter({
      group: Object,
      option: Object,
      isEnabled: Boolean,
    }) {
      return {
        type: group.value === 'text' ? SET_TEXT_FILTER : SET_FILTER,
        group,
        option,
        isEnabled,
      };
    }

**Consider: type annotation for new projects** (Flow or TypeScript)

String formatting (uniformity)
------------------------------

* Python
    * Use format strings: `f”{2 + 2}”`
    * Or .format() if in Python < 3.6
* JS
    * Use template strings

Naming (uniformity)
-------------------

* Boolean fields: is_foo and has_bar
* Python
    * snake_case variables and method names
    * UpperCamel for classes
* JS
     * camelCase variables and method names

Wrapping
--------

Long parameter lists:

.. code-block:: javascript

    function foo(a, b, c, d, e, f, g, h, i, j) { ... }


becomes

.. code-block:: javascript

    function foo(
      a,
      b,
      c,
      d,
      ...
    ) {
      ...
    }

**Rule: All on one line, or one parameter per line**


Complex if statements
---------------------

.. code-block:: javascript

    if (!this.normandy.testing && (
      await this.heartbeatShownRecently() ||
      await this.surveyHasShown()
    )) {
      return;
    }

becomes

.. code-block:: javascript

    const hasShown = await this.heartbeatShownRecently() || await this.surveyHasShown();
    if (!this.normandy.test && hasShown) { ... }

**Rule: No extra parens inside if conditions**


Placement of operators
----------------------

Bad
~~~~

.. code-block:: javascript

    const hasExecuted = await this.heartbeatShownRecently() ||
      await this.surveyHasShown();

Good
~~~~

.. code-block:: javascript

    const hasExecuted = await this.heartbeatShownRecently()
      || await this.surveyHasShown();

**Rule: put boolean operators on the next line**

Really long if statements
-------------------------

**Rule: indent on the next line**

.. code-block:: javascript

    if (
        thisIsAReallyLongName
        && thisIsAReallyLongNameAlso
        && thisIsAReallyLongNameAsWell
    ) {
        console.log('ok');
    }

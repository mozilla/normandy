opt-out-study: Install a Study Add-on Without Prompting
=======================================================

.. note::

   A note on terminology: This action refers to the unit of work as a
   "study". This isn't exactly correct, and doesn't mesh well with the rest
   of the usage in Normandy.

   A more correct definition is that a study is a line of inquiry that asks a
   question, gathers some data, and draws a conclusion. An individual study
   may have zero or more experiments. This action represents a single
   experiment.

   On this page the name "study" is still used for compatibility reasons.
   Please be aware that today this would be called an experiment, not a
   study. In the future this incongruence will be fixed.


.. note::

   On the meaning of "opt-out": This action was developed at a time where
   there were already existing studies involving add-ons happening. These
   older studies worked by prompting users via Heartbeat to install an
   extension.

   These older studies were called "opt-in add-on studies" or often just
   "opt-in studies". At the time the major difference between that existing
   pattern and this new action was that this was opt-*out*. Users could
   opt-out of individual studies or the whole program, but were opted-in by
   default.

   The important detail at the time was that the studies were opt-out. Today
   that style of opt-in study has died off, and now this action has a
   confusing name. It is difficult to change the names of actions however.
   Please be aware that better name for this action would be
   "opt-out-addon-experiment", or just "addon-experiment"

The ``opt-out-study`` action installs an add-on, typically one that
implements a feature experiment by changing Firefox and measuring how it
affects the user.

Each recipe corresponds to a single _study_; you could run multiple studies (
using multiple recipes) that use the same add-on.

Arguments
---------
Name
   User-facing name of the study, shown in ``about:studies``.
Description
   User-facing description of the study, shown in ``about:studies``.
Add-on
   The add-on to install. The list of available add-ons pulls from the add-ons
   that have been uploaded via the Extensions listing.
Pause Enrollment
   When checked, new participants will not be enrolled in the study, and
   existing participants will continue to run the study add-on. When
   unchecked, new participants will continue to be enrolled based on the
   recipe filters. This is useful to prevent a study's population from
   growing while still collecting additional data from the users already
   enrolled.

Uploading Add-ons
-----------------
Add-ons to be used in studies can be uploaded to Normandy via the extensions
page of Delivery Console, accessible from the home page.

Add-ons used in studies must be signed using a special key. Please contact
the Normandy development team for more details.

User Flow
---------
After the user matches the filter expression and executes the recipe:

1. If the user is eligible for the study, they are enrolled. A user is
   ineligible if:

   * Their `opt-out preference <opt-out-preference>`_ is set to ``false``.
   * They have participated in this study/recipe previously.
   * They have an add-on installed with the same ID as the study add-on.

2. The add-on is downloaded and installed on their system, and study info is
   saved on the client.
3. Once it's done running the experiment, the study add-on should uninstall
   itself, which marks the study as complete.

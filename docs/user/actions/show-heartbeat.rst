show-heartbeat: Show Heartbeat Prompt
=====================================
The ``show-heartbeat`` action shows a bar at the top of the browser viewport
with a message and either a set of rating stars or a button that the user can
interact with.

.. image:: heartbeat.png
   :align: center

When shown a Heartbeat prompt, users can:

- Click a star or the button (depending on which is shown), which replaces the
  bar contents with a "Thank you" message and optionally opens a webpage in a
  new tab. The "Thank you" message should disappear after a short delay.
- Click the "Learn More" link on the right side of the bar, which opens a
  webpage in a new tab and does **not** dismiss the bar.
- Click the close button on the far right of the bar, which dismisses it
  entirely.

A maximum of one Heartbeat prompt will be shown to a user on any given day
from any recipe. Recipes can configure heartbeat prompts to have one of three
repetition modes. These repetition rules are applied on a per-recipe basis,
while also respecting the global rate limit of one-per-day.

Telemetry Ping
--------------
Whenever the user interacts with the prompt, a ping is written to Telemetry_
with information on how the user has interacted with the current prompt thus
far. The `"heartbeat" ping documentation`_ has more information on the
contents of the ping.

.. _Telemetry: https://wiki.mozilla.org/Telemetry
.. _"heartbeat" ping documentation: https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/data/heartbeat-ping.html

Arguments
---------
Survey ID
   An identifier for the survey used to distinguish between different surveys
   during analysis. Typically this is alphanumeric and dashes (``-``).
Message
   Main display text for the Heartbeat prompt.
Engagement Button Label
   **Optional.** If blank, the prompt will have rating stars. Otherwise, the
   prompt will have a button with the given label.
Thanks Message
   Message to show after the user clicks the rating stars or button.
Post-Answer URL
   **Optional.** URL to open in a new tab after the user clicks the rating
   stars or button.
Learn More Message
   **Optional.** Text to use for the "Learn More" link. If blank, the link is
   not displayed.
Learn More URL
   **Optional.** URL to open in a new tab after the user clicks the
   "Learn More" link. If blank, the link is not displayed.
Include Telemetry UUID
   If this is set to true, extra information is included in Telemetry and the
   Post Answer URL in order to correlate the two, such as linking Telemetry
   data with survey responses.
How often should this prompt be shown
   This field has three values:

   1. Show this prompt once
   2. Show this prompt until the user interacts with it, and then never again.
   3. Show users this prompt once every X days.

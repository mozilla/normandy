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

After a Heartbeat prompt has been shown to a user once, it will store a flag
and not show itself to the user again until 7 days have passed since the last
time it was shown. This happens on a per-recipe basis. This does not apply when
the recipe is viewed in testing mode, such as within the admin preview.

Telemetry Ping
--------------
Whenever the user interacts with the prompt, a ping is written to Telemetry_
with information on how the user has interacted with the current prompt thusfar.
The `"heartbeat" ping documentation`_ has more information on the contents of
the ping.

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
   **Optional.** URL to open in a new tab after the user clicks the rating stars
   or button.
Learn More Message
   **Optional.** Text to use for the "Learn More" link. If blank, the link is
   not displayed.
Learn More URL
   **Optional.** URL to open in a new tab after the user clicks the "Learn More"
   link. If blank, the link is not displayed.

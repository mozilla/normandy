Feature Experiments
===================
This document describes the feature experiments that are currently implemented
across the Normandy project, and how to enable them.

Recipe Client Add-on
--------------------

Lazy Client Classification
~~~~~~~~~~~~~~~~~~~~~~~~~~
By default, the recipe client makes a request to an endpoint on the recipe
server to calculate some info about the user that we don't trust the client to
determine, such as geolocation or the current server time. Normally, this
happens on startup; enabling this experiment makes the client only make the
classification request if a recipe actually uses the info for filtering.

To enable, create a new boolean preference called
``app.normandy.experiments.lazy_classify`` and set it to true.

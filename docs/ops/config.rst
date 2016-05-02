Configuration
=============
All configuration happens through environment variables.

Django settings
---------------
These settings map directly to built-in Django settings. An environment
variable like ``DJANGO_FOO`` controls the Django setting ``FOO``. Not all
Django settings are available for configuration.

``DATABASE_URL``
    A `database url`_, including any username and password, if needed.
    Default ``postgres://postgres@localhost/normandy``.
``DJANGO_SECRET_KEY``
    A string used to as a seed for security features. This should be the same
    on all instances that share a database, and should be kept secret. It
    should be a long, random string. Required, no default.
``DJANGO_DEBUG``
    ``true`` or ``false``. Default ``false``. Enables Django's debug mode. This
    should never be enabled on permanent servers. It is inefficient and leaks
    memory.
``DJANGO_MEDIA_URL``
    The url to prefix for media files (files uploaded to the service).
    Default ``/media/``. Both host-relative (``/media/``) and host-absolute
    urls (``https://cdn.example.com/``) work. Should end in a slash.
``DJANGO_STATIC_URL``
    The url to prefix for static files (files shipped with the service).
    Default ``/static/``. Both host-relative and host-absolute urls work.
    Should end in a slash.
``DJANGO_CONFIGURATION``
    The name of the set of configurations to use as the base. Default
    ``Production``. Useful options are

    * ``Production`` - Preferred
    * ``ProductionInsecure`` - For systems running without HTTPS
    * ``Build`` - This is used during CI to build static assets
    * ``Development`` - This is used by developers
    * ``Test`` - Used during unit tests
``DJANGO_ALLOWED_HOSTS``
    A comma-seperated list of host values to accept. Defaults to an empty
    string. Examples: ``example.com,www.example.com``, ``.example.com``
    (matches any subdomain of example.com), ``*`` (allows everything). This
    setting is required to be set. If there are other protections (such as
    load balancers), setting this to ``*`` presents no risk.

Normandy settings
-----------------
These settings are specific to Normandy. In other words, they won't be present
in other Django projects.

``DJANGO_GEOIP2_DATABASE``
    Path to a Maxmind GeoIP Country database. Default ``/app/GeoIP2-Country.mmdb``.
``DJANGO_CAN_EDIT_ACTIONS_IN_USE``
    To avoid unexpected changes, Normandy can make actions in use read-only.
    This setting controls that. Default ``false``.
``DJANGO_ADMIN_ENABLED``
    For security, Normandy can disable write access. This should be enabled on
    production servers. Servers with this setting set to ``false`` shouldn't
    require write access to Postgres. Default ``true``.
``DJANGO_ACTION_IMPLEMENTATION_CACHE_TIME``
    Sets the time in seconds an Action is cached for with the HTTP
    ``Cache-Control`` header. Defaults to 1 year.
``DJANGO_NUM_PROXIES``
    The number of proxies between users and Normandy. This is used to parse
    the ``X-Forwarded-For`` header. Defaults to 0.
``DJANGO_RAVEN_CONFIG_DSN``
    The DSN for Raven to report errors to Sentry. Default ``None``. Not
    required.
``DJANGO_CACHES_RECIPE_TIME``
    The amount of time in seconds to hold Recipes in the cache. This may be set
    to 0 in non-production environments to ease testing. In production
    environments, setting this value too low can be a denial-of-service risk.
    Default 5 minutes.

.. _database url: https://github.com/kennethreitz/dj-database-url#url-schema

Gunicorn settings
-----------------
These settings control how Gunicorn starts, when the default command of the
provided Dockerfile is used.

``GUNICORN_WORKER_CLASS``
    The worker class to use. Defaults to ``sync``. Supported options are
    ``sync``, ``gevent``, and ``eventlet``.
``GUNICORN_MAX_REQUESTS``
    If set to a positive number, after serving this many requests, individual
    Gunicorn works will be recycled. This can be helpful to avoid potential
    memory leaks. Defaults to 0 (no cycling).
``WEB_CONCURRENCY``
    The number of workers to use. Defaults to 1. Recommended values are in the
    range of ``2-4 x $(NUM_CORES)``.

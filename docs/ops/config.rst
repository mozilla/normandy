Configuration
=============
All configuration happens through environment variables.

Django settings
---------------
These settings map directly to built-in Django settings. An environment
variable like ``DJANGO_FOO`` controls the Django setting ``FOO``. Not all
Django settings are available for configuration.

.. note::

    Default values given refer to ``Production`` configurations, which is the
    default in Docker images.. Other configurations may have defaults not
    listed here.

.. envvar:: DATABASE_URL

    :default: ``postgres://postgres@localhost/normandy``
    :documentation: https://github.com/kennethreitz/dj-database-URL#URL-schema

    A database URL, including any username and password, if needed.

.. envvar:: DJANGO_ALLOWED_HOSTS

    :default: Empty string
    :documentation: https://docs.djangoproject.com/en/1.9/ref/settings/#std:allowed-hosts

    A comma-seperated list of host values to accept. Examples:
    ``example.com,www.example.com``, ``.example.com``
    (matches any subdomain of example.com), ``*`` (allows everything). This
    setting is required to be set. If there are other protections (such as
    load balancers), setting this to ``*`` presents no risk.

.. envvar:: DJANGO_CONFIGURATION

    :default: ``Production``
    :documentation: http://django-configurations.readthedocs.io/en/stable/

    The name of a configuration preset to use for this environment. Useful
    values are

    * ``Production`` - Preferred
    * ``ProductionInsecure`` - For systems running without HTTPS
    * ``Build`` - This is used during CI to build static assets
    * ``Development`` - This is used by developers
    * ``Test`` - Used during unit tests

.. envvar:: DJANGO_DEBUG

    :default: ``false``
    :documentation: https://docs.djangoproject.com/en/1.9/ref/settings/#std:debug

    ``true`` or ``false``. Enables Django's debug mode. This should never be
    enabled on permanent servers. It is inefficient and leaks memory.

.. envvar:: DJANGO_MEDIA_URL

    :default: ``/media/``
    :documentation: https://docs.djangoproject.com/en/1.9/ref/settings/#std:media-url

    The URL prefix for media files (files uploaded to the service). Both
    host-relative (``/media/``) and host-absolute URLs
    (``https://cdn.example.com/``) work. Should end in a slash.

.. envvar:: DJANGO_SECRET_KEY

    :required: True
    :documentation: https://docs.djangoproject.com/en/1.9/ref/settings/#std:setting-SECRET_KEY

    A string used as a seed for security features. This should be the same
    on all instances that share a database, and should be kept secret. It
    should be a long, random string. This field is required to be set in
    most environments.

.. envvar:: DJANGO_STATIC_URL

    :default: ``/static/``
    :documentation: https://docs.djangoproject.com/en/1.9/ref/settings/#std:static-url

    The URL prefix for static files (files shipped with the service). Both
    host-relative and host-absolute URLs work. Should end in a slash.

.. envvar:: DJANGO_CONN_MAX_AGE

    :default: ``0``
    :documentation: https://docs.djangoproject.com/en/1.9/ref/settings/#std:setting-CONN_MAX_AGE

    Time to hold database connections open. If set to 0, will close every
    database connection immediately. Each worker (as controlled by
    ``WEB_CONCURRENCY``) will have its own connection.

Normandy settings
-----------------
These settings are specific to Normandy. In other words, they won't be present
in other Django projects.

.. envvar:: DJANGO_GEOIP2_DATABASE

    :default: ``/app/GeoIP2-Country.mmdb``

    Path to a Maxmind GeoIP Country database.

.. envvar:: DJANGO_ADMIN_ENABLED

    :default: ``true``

    For security, Normandy can disable write access. This should be enabled on
    production servers. Servers with this setting set to ``false`` shouldn't
    require write access to Postgres.

.. envvar:: DJANGO_ACTION_IMPLEMENTATION_CACHE_TIME

    :default: ``31536000`` (1 year)

    Sets the time in seconds an Action is cached for with the HTTP
    ``Cache-Control`` header.

.. envvar:: DJANGO_NUM_PROXIES

    :default: ``0``

    The number of proxies between users and Normandy. This is used to parse
    the ``X-Forwarded-For`` header.

.. envvar:: DJANGO_RAVEN_CONFIG_DSN

    :default: ``None``

    The DSN for Raven to report errors to Sentry. Defaults to ``None``. Not
    required.

.. envvar:: DJANGO_CACHES_RECIPE_TIME

    :default: ``300`` (5 minutes)

    The amount of time in seconds to hold Recipes in the cache. This may be set
    to 0 in non-production environments to ease testing. In production
    environments, setting this value too low can be a denial-of-service risk.

.. envvar:: DJANGO_AUTOGRAPH_URL

    The URL where an Autograph_ server can be reached. If left blank, content
    signing will be disabled.

    .. _Autograph: https://github.com/mozilla-services/autograph/

.. envvar:: DJANGO_AUTOGRAPH_HAWK_ID

    The pre-arranged ID to use for Hawk authentication with Autograph.

.. envvar:: DJANGO_AUTOGRAPH_SECRET_KEY

    The pre-arranged secret key to use for Hawk authentication with Autograph.

.. envvar:: DJANGO_AUTOGRAPH_SIGNATURE_MAX_AGE

    :default: ``604800`` (1 week)

    Content with signature ages older than this are considered out of date and
    will be re-signed. The keys used by Autograph to sign content are generally
    only valid for a few weeks, and have a period of overlap where both the new
    key and old key are valid. The aim with this setting is to be as long as
    possible while still guaranteeing that actions will get resigned during the
    overlap period.

.. envvar:: DJANGO_API_CACHE_TIME

    :default: ``30``

    The time in seconds to set in cache headers for cacheable APIs. This may be
    set to 0 in non-production environments to ease testing. In production
    environments, setting this value too low can be a denial-of-service risk.

.. envvar:: DJANGO_LOGGING_USE_JSON

    :default: ``True``

    If this setting is true, standard logging will be output in mozlog_ format.
    Otherwise logs will be unstructured.

    .. _mozlog: https://github.com/mozilla-services/Dockerflow/blob/master/docs/mozlog.md

Gunicorn settings
-----------------
These settings control how Gunicorn starts, when the default command of the
provided Dockerfile is used.

.. envvar:: GUNICORN_WORKER_CLASS

    :default: ``sync``
    :documentation: http://docs.gunicorn.org/en/latest/settings.html#worker-class

    The worker class to use. Supported options are ``sync``, ``gevent``, and
    ``eventlet``.

.. envvar:: GUNICORN_MAX_REQUESTS

    :default: ``0`` (no cycling)
    :documentation: http://docs.gunicorn.org/en/latest/settings.html#max-requests

    If set to a positive number, after serving this many requests, individual
    Gunicorn works will be recycled. This can be helpful to avoid potential
    memory leaks.

.. envvar:: WEB_CONCURRENCY

    :default: ``1``
    :documentation: http://docs.gunicorn.org/en/latest/settings.html#workers

    The number of workers to use. Recommended values are in the range of
    ``2-4 x $(NUM_CORES)``.

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

    Time to hold database connections open in seconds. If set to 0, will close
    every database connection immediately. Each worker (as controlled by
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

.. envvar:: DJANGO_IMMUTABLE_CACHE_TIME

    :default: ``31536000`` (1 year)

    Sets the time in seconds immutable objects (such as Action implementations)
    are cached for with the HTTP ``Cache-Control`` header.

.. envvar:: DJANGO_NUM_PROXIES

    :default: ``0``

    The number of proxies between users and Normandy. This is used to parse
    the ``X-Forwarded-For`` header.

.. envvar:: DJANGO_RAVEN_CONFIG_DSN

    :default: ``None``

    Optional. The DSN for Raven to report errors to Sentry.

.. envvar:: DJANGO_RAVEN_CONFIG_RELEASE

    :default: ``None``

    Optional. The release for Raven to report to Sentry. Automatically set by
    production Docker images.

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

.. envvar:: DJANGO_AUTOGRAPH_X5U_CACHE_BUST

    :default: Unset

    If set, the value will be added to the URL for the x5u certificate chain as
    a query parameter named `cachebust`. This is used to force clients to
    re-fetch the certificate chain in cases where they're caching an expired or
    otherwise invalid copy of the chain.

.. envvar:: DJANGO_API_CACHE_TIME

    :default: ``30``

    The time in seconds to set in cache headers for cacheable APIs. This may be
    set to 0 in non-production environments to ease testing. In production
    environments, setting this value too low can be a denial-of-service risk.

.. envvar:: DJANGO_API_CACHE_ENABLED

    :default: ``True``

    Controls cache headers for cacheable APIs. If true, API views will send
    headers indicating that they can be cached according to
    :envvar:`DJANGO_API_CACHE_TIME`. If false, API views will send headers
    indicating that they should never be cached.

.. envvar:: DJANGO_PERMANENT_REDIRECT_CACHE_TIME

   :default: ``2592000`` (30 days)

   The time in seconds to set in cache headers for permanent redirects.

.. envvar:: DJANGO_HTTPS_REDIRECT_CACHE_TIME

   :default: ``2592000`` (30 days)

   The time in seconds to set in cache headers for permanent redirects
   to change from HTTP to HTTPS.

.. envvar:: DJANGO_LOGGING_USE_JSON

    :default: ``True``

    If this setting is true, standard logging will be output in mozlog_ format.
    Otherwise logs will be unstructured.

    .. _mozlog: https://github.com/mozilla-services/Dockerflow/blob/master/docs/mozlog.md

.. envvar:: DJANGO_CSP_REPORT_URI

   :default: ``None``

   Controls the ``report-uri`` directive in the Content Security Policy header.
   Attempts to violate the Content Security Policy are sent by the browser to
   this URL. See the `MDN documentation on report-uri <report-uri>`_ for more
   info.

   .. _report-uri: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-uri

.. envvar:: DJANGO_CDN_URL

   :default: ``None``

   The URL of a CDN that is backed by Normandy, if one is in use. This is used to
   enforce that immutable content is routed through the CDN. Must end with a
   slash (``/``).

.. envvar:: DJANGO_APP_SERVER_URL

   :default: ``None``

   The URL that allows direct access to Normandy, bypassing any CDNs. This
   is used for content that cannot be cached. If not specified, Normandy will
   assume direct access. Must end with a slash (``/``).

.. envvar:: DJANGO_USE_OIDC

   :default: ``False``

   If enabled, Normandy will authenticate users by reading a header in requests.
   The expectation is that a proxy server, such as Nginx, will perform
   authentication using Open ID Connect, and then pass the unique ID of the user
   in a header.

   .. seealso::

      :envvar:`DJANGO_OIDC_REMOTE_AUTH_HEADER` for which header Normandy
      reads this value from.

   .. warning::

      If this feature is enabled, the proxy server providing authentication
      *must* sanitize the headers passed along to Normandy. Specifically, the
      header defined in :envvar:`DJANGO_OIDC_REMOTE_AUTH_HEADER` must not be
      passed on from the user.

      Failing to do this will result in any client being able to authenticate
      as any user, with no checks.

.. envvar:: DJANGO_OIDC_REMOTE_AUTH_HEADER

   :default: ``HTTP_REMOTE_USER``

   If :envvar:`DJANGO_USE_OIDC` is ``True``, this is the source of the user to
   authenticate. This must match Django header normalization, i.e. it must be
   capitalized, dashes replaced with underscores, and be prefixed with ``HTTP_``.

   For example, the header ``OIDC-Claim-User-Profile-Email`` becomes
   ``HTTP_OIDC_CLAIM_USER_PROFILE_EMAIL``.

.. envvar:: DJANGO_OIDC_LOGOUT_URL

   If :envvar:`DJANGO_USE_OIDC` is set to ``True``, this settings must be set to
   the URL that a user can visit to logout. It may be a relative URL.

.. envvar:: DJANGO_PEER_APPROVAL_ENFORCED

   :default: ``True``

   If ``True``, approval requests for recipe changes can only be approved by a
   different user than the one who created the request. If ``False``, approval
   requests can be approved by the same user who created it.

   This defaults to ``False`` for local developer instances.

.. envvar:: DJANGO_CERTIFICATES_EXPIRE_EARLY_DAYS

   If set, when checking certificates for validity, start failing
   system checks this many days before the certificate would expire.

.. envvar:: DJANGO_CORS_ORIGIN_ALLOW_ALL

   :default: ``False``

   Respond with ``Access-Control-Allow-Origin: *`` if set to True. If False,
   needs the ``Origin`` header needs to match ``DJANGO_CORS_ORIGIN_WHITELIST``.
   In all environments other than ``Production`` this is set to True.

   .. note::

      The CORS headers only apply to URLs that match the regex ``/api/*``.

.. envvar:: DJANGO_CORS_ORIGIN_WHITELIST

   :default: ``[]``

   List of domains (with or without ``https://`` prefix, but ideally with)
   that is included in ``Access-Control-Allow-Origin`` header.
   Ideally this should list all the client-side apps that should be allowed
   to make remote XHR requests.

.. envvar:: DJANGO_CORS_ALLOW_METHODS

   :default: ``['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']``

   List of allowed CORS methods if applicable. Specifically this list is
   reduced to "read-only" methods when using the ``ProductionReadOnly``
   configuration.

.. envvar:: DJANGO_OIDC_USER_ENDPOINT

   :default: ``https://auth.mozilla.auth0.com/userinfo``

   URL where we sent access tokens received as an authorization bearer token.
   This URL needs to match the OIDC domain used by the client to authenticate.
   The value for this setting is usually listed in
   ``/.well-known/openid-configuration`` on the OIDC provider.

.. envvar:: DJANGO_DEFAULT_FILE_STORAGE 

   :default: ``normandy.base.storage.S3Boto3PermissiveStorage``

   The Python import path for the file storage backend to use. For AWS, use
   the default value of ``normandy.base.storage.S3Boto3PermissiveStorage``.
   For GCP, use ``normandy.base.storage.NormandyGoogleCloudStorage``.

   When using AWS, it is required to also set
   ``DJANGO_AWS_STORAGE_BUCKET_NAME``. ``DJANGO_AWS_ACCESS_KEY_ID`` and
   ``DJANGO_AWS_SECRET_ACCESS_KEY`` may also be needed.

   When using GCP, it is required to also set
   ``DJANGO_GS_BUCKET_NAME``.

.. envvar:: DJANGO_AWS_ACCESS_KEY_ID

   The Access Key ID for an AWS user with read/write access to the S3 bucket.
   This is required by django-storages_ to access S3.

    .. _django-storages: https://github.com/jschneier/django-storages

.. envvar:: DJANGO_AWS_SECRET_ACCESS_KEY

   The Secret Access Key for the AWS user identified by
   :envvar:`DJANGO_AWS_ACCESS_KEY_ID`. This is also required by
   django-storages to access S3.

.. envvar:: DJANGO_AWS_STORAGE_BUCKET_NAME

   The name of the S3 bucket to be used to store media files.

.. envvar:: DJANGO_GS_BUCKET_NAME

   The name of the Google storage bucket to be used to store media files.


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

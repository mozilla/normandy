import os

from configurations import Configuration, values


class Core(Configuration):
    """Settings that will never change per-environment."""
    # Build paths inside the project like this: os.path.join(BASE_DIR, ...)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Application definition
    INSTALLED_APPS = [
        'normandy.base.apps.BaseApp',
        'normandy.control.apps.ControlApp',
        'normandy.health.apps.HealthApp',
        'normandy.recipes.apps.RecipesApp',
        'normandy.selfrepair',
        'normandy.studies',
        'product_details',
        'rest_framework',
        'rest_framework.authtoken',
        'rest_framework_swagger',
        'reversion',
        'storages',
        'raven.contrib.django.raven_compat',
        'webpack_loader',

        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'whitenoise.runserver_nostatic',
        'django.contrib.staticfiles',
    ]

    # Middleware that ALL environments must have. See the Base class for
    # details.
    MIDDLEWARE = [
        'normandy.base.middleware.request_received_at_middleware',
        'normandy.base.middleware.RequestSummaryLogger',
        'normandy.base.middleware.NormandySecurityMiddleware',
        'normandy.base.middleware.NormandyWhiteNoiseMiddleware',
        'normandy.base.middleware.NormandyCommonMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
        'csp.middleware.CSPMiddleware',
    ]

    ROOT_URLCONF = 'normandy.urls'

    TEMPLATES = [
        {
            'BACKEND': 'django.template.backends.django.DjangoTemplates',
            'DIRS': [],
            'APP_DIRS': True,
            'OPTIONS': {
                'context_processors': [
                    'django.template.context_processors.debug',
                    'django.template.context_processors.request',
                    'django.contrib.auth.context_processors.auth',
                    'django.contrib.messages.context_processors.messages',
                    'django.template.context_processors.static',
                ],
            },
        },
    ]

    WSGI_APPLICATION = 'normandy.wsgi.application'

    # Internationalization
    LANGUAGE_CODE = 'en-us'
    TIME_ZONE = 'UTC'
    USE_I18N = False
    USE_L10N = False
    USE_TZ = True

    # Static files (CSS, JavaScript, Images)
    STATICFILES_FINDERS = [
        'django.contrib.staticfiles.finders.FileSystemFinder',
        'django.contrib.staticfiles.finders.AppDirectoriesFinder',
        'npm.finders.NpmFinder',
    ]

    NPM_DESTINATION_PREFIX = 'npm'
    NPM_FILE_PATTERNS = {
        'babel-polyfill': ['dist/*.js'],
        'font-awesome': ['css/*.css', 'fonts/*'],
        'node-uuid': ['uuid.js'],
        'jquery': ['dist/*.js'],
        'json-editor': ['dist/*.js'],
        'wolfy87-eventemitter': ['EventEmitter.js'],
        'mozjexl': ['dist/*.js'],
    }

    REST_FRAMEWORK = {
        'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework.authentication.SessionAuthentication'],
        'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
        'TEST_REQUEST_DEFAULT_FORMAT': 'json',
        'DEFAULT_RENDERER_CLASSES': (
            'normandy.base.api.renderers.CanonicalJSONRenderer',
            'normandy.base.api.renderers.CustomBrowsableAPIRenderer',
        ),
        'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
        'PAGE_SIZE': 10,
        'EXCEPTION_HANDLER': 'normandy.base.api.views.exception_handler',
    }

    WEBPACK_LOADER = {
        'DEFAULT': {
            'BUNDLE_DIR_NAME': 'bundles/',
            'STATS_FILE': os.path.join(BASE_DIR, 'webpack-stats.json')
        },
        'ACTIONS': {
            'BUNDLE_DIR_NAME': 'bundles/',
            'STATS_FILE': os.path.join(BASE_DIR, 'webpack-stats-actions.json')
        },
        'VENDOR': {
            'BUNDLE_DIR_NAME': 'bundles/',
            'STATS_FILE': os.path.join(BASE_DIR, 'webpack-stats-vendor.json')
        }
    }

    # Content Security Policy
    def CSP_DEFAULT_SRC(self):
        srcs = ["'self'"]
        if self.CDN_URL:
            srcs.append(self.CDN_URL)
        if self.EXPERIMENTER_HOST:
            srcs.append(self.EXPERIMENTER_HOST)
        return srcs

    CSP_OBJECT_SRC = "'none'"  # not using <object>, <embed>, and <applet> elements
    CSP_WORKER_SRC = "'none'"  # not using JS Worker, SharedWorker, or ServiceWorkers
    CSP_FRAME_SRC = "'none'"  # not using frames or iframes
    CSP_BLOCK_ALL_MIXED_CONTENT = True

    # these don't fallback to default-src
    CSP_BASE_URI = "'none'"  # not using <base>
    CSP_FORM_ACTION = "'self'"  # we only submit forms to ourselves

    # TODO(mythmon) Re-add this once either:
    #   1) We know the domain we can use for Firefox's framing of the self-repair frame
    #   2) We've deprecated the self-repair frame entirely
    #   3) django-csp allows removing directives on an individual view (mozilla/django-csp#85)
    # CSP_FRAME_ANCESTORS = "'none'"  # Block framing by default

    # Action names and the path they are located at.
    ACTIONS = {
        'console-log': os.path.join(BASE_DIR, 'client/actions/console-log'),
        'show-heartbeat': os.path.join(BASE_DIR, 'client/actions/show-heartbeat'),
        'preference-experiment': os.path.join(BASE_DIR, 'client/actions/preference-experiment'),
        'opt-out-study': os.path.join(BASE_DIR, 'client/actions/opt-out-study'),
    }

    PROD_DETAILS_STORAGE = values.Value('normandy.recipes.storage.ProductDetailsRelationalStorage')

    SWAGGER_SETTINGS = {
        'DOC_EXPANSION': 'list',
    }

    AWS_QUERYSTRING_AUTH = False

    # We changed the CSRF cookie from http-only to non http-only and need to override existing
    # cookies. The easiest way is just change the cookie name when such changes happen.
    CSRF_COOKIE_NAME = 'csrftoken-20170707'

    EXPERIMENTER_HOST = values.Value()

    def EXPERIMENTER_API_URL(self):
        if self.EXPERIMENTER_HOST is not None:
            return '{host}/api/v1'.format(host=self.EXPERIMENTER_HOST)


class Base(Core):
    """Settings that may change per-environment, some with defaults."""

    # Flags that affect other settings, via setting methods below
    LOGGING_USE_JSON = values.BooleanValue(False)
    USE_OIDC = values.BooleanValue(False)

    # General settings
    DEBUG = values.BooleanValue(False)
    ADMINS = values.SingleNestedListValue([])
    SILENCED_SYSTEM_CHECKS = values.ListValue([
        # We've subclassed Django's security middleware, so Django's
        # checks can't tell we are using the middleware.
        'security.W001',
        # Check CSRF cookie http only. disabled because we read the
        # CSRF cookie in JS for forms in React.
        'security.W017',
    ])

    # Authentication
    def AUTHENTICATION_BACKENDS(self):
        if self.USE_OIDC:
            return ['normandy.base.auth_backends.LoggingRemoteUserBackend']
        else:
            return ['normandy.base.auth_backends.LoggingModelBackend']

    OIDC_REMOTE_AUTH_HEADER = values.Value('HTTP_REMOTE_USER')
    OIDC_LOGOUT_URL = values.Value(None)

    # Middleware that _most_ environments will need. Subclasses can override this list.
    EXTRA_MIDDLEWARE = [
        'django.contrib.sessions.middleware.SessionMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
    ]

    def MIDDLEWARE(self):
        """
        Determine middleware by combining the core set and
        per-environment set.
        """
        middleware = Core.MIDDLEWARE + self.EXTRA_MIDDLEWARE
        if self.USE_OIDC:
            middleware.append('normandy.base.middleware.ConfigurableRemoteUserMiddleware')
        return middleware

    def LOGGING(self):
        return {
            'version': 1,
            'disable_existing_loggers': False,
            'formatters': {
                'json': {
                    '()': 'mozilla_cloud_services_logger.formatters.JsonLogFormatter',
                    'logger_name': 'normandy',
                },
                'development': {
                    'format': '%(levelname)s %(asctime)s %(name)s %(message)s',
                },
            },
            'handlers': {
                'console': {
                    'level': 'DEBUG',
                    'class': 'logging.StreamHandler',
                    'formatter': 'json' if self.LOGGING_USE_JSON else 'development',
                },
            },
            'root': {
                'handlers': ['console'],
                'level': 'WARNING',
            },
            'loggers': {
                'normandy': {
                    'propagate': False,
                    'handlers': ['console'],
                    'level': 'DEBUG',
                },
                'request.summary': {
                    'propagate': False,
                    'handlers': ['console'],
                    'level': 'DEBUG',
                },
            },
        }

    # Remote services
    DATABASES = values.DatabaseURLValue('postgres://postgres@localhost/normandy')
    CONN_MAX_AGE = values.IntegerValue(0)
    GEOIP2_DATABASE = values.Value(os.path.join(Core.BASE_DIR, 'GeoLite2-Country.mmdb'))
    # Email settings
    EMAIL_HOST_USER = values.Value()
    EMAIL_HOST = values.Value()
    EMAIL_PORT = values.IntegerValue(587)
    EMAIL_USE_TLS = values.BooleanValue(True)
    EMAIL_HOST_PASSWORD = values.Value()
    EMAIL_BACKEND = values.Value('django.core.mail.backends.smtp.EmailBackend')

    def RAVEN_CONFIG(self):
        version_path = os.path.join(Core.BASE_DIR, '__version__', 'tag')
        try:
            with open(version_path) as f:
                version = f.read().strip()
        except IOError:
            version = None

        return {
            'dsn': values.URLValue(None, environ_name='RAVEN_CONFIG_DSN'),
            'release': values.Value(version, environ_name='RAVEN_CONFIG_RELEASE'),
        }

    # statsd
    STATSD_HOST = values.Value('localhost')
    STATSD_PORT = values.IntegerValue(8125)
    STATSD_IPV6 = values.BooleanValue(False)
    STATSD_PREFIX = values.Value('normandy')
    STATSD_MAXUDPSIZE = values.IntegerValue(512)

    # Security settings
    SECRET_KEY = values.SecretValue()
    ALLOWED_HOSTS = values.ListValue([])
    AUTH_PASSWORD_VALIDATORS = [
        {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
        {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
        {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
        {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
    ]
    PASSWORD_HASHERS = values.ListValue([
        'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
        'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    ])
    USE_X_FORWARDED_HOST = values.BooleanValue(False)
    SECURE_PROXY_SSL_HEADER = values.TupleValue()
    SECURE_HSTS_SECONDS = values.IntegerValue(3600)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = values.BooleanValue(True)
    CSRF_COOKIE_HTTPONLY = values.BooleanValue(False)
    CSRF_COOKIE_SECURE = values.BooleanValue(True)
    SECURE_SSL_REDIRECT = values.BooleanValue(True)
    SECURE_REDIRECT_EXEMPT = values.ListValue([])
    SESSION_COOKIE_SECURE = values.BooleanValue(True)
    SECURE_BROWSER_XSS_FILTER = values.BooleanValue(True)
    SECURE_CONTENT_TYPE_NOSNIFF = values.BooleanValue(True)
    X_FRAME_OPTIONS = values.Value('DENY')
    REQUIRE_RECIPE_AUTH = values.BooleanValue(True)

    # Media and static settings
    STATIC_URL = values.Value('/static/')
    STATIC_ROOT = values.Value(os.path.join(Core.BASE_DIR, 'static'))
    MEDIA_URL = values.Value('/media/')
    MEDIA_ROOT = values.Value(os.path.join(Core.BASE_DIR, 'media'))

    STATICFILES_DIRS = (
        os.path.join(Core.BASE_DIR, 'assets'),
    )

    # URL that the CDN exists at to front cached parts of the site, if any.
    CDN_URL = values.URLValue(None)
    # URL that bypasses any CDNs
    APP_SERVER_URL = values.URLValue(None)

    # URL for the CSP report-uri directive.
    CSP_REPORT_URI = values.Value('/__cspreport__')

    # Normandy settings
    ADMIN_ENABLED = values.BooleanValue(True)
    ACTION_IMPLEMENTATION_CACHE_TIME = values.IntegerValue(60 * 60 * 24 * 365)
    NUM_PROXIES = values.IntegerValue(0)
    API_CACHE_TIME = values.IntegerValue(30)
    API_CACHE_ENABLED = values.BooleanValue(True)
    PERMANENT_REDIRECT_CACHE_TIME = values.IntegerValue(60 * 60 * 24 * 30)
    HTTPS_REDIRECT_CACHE_TIME = values.IntegerValue(60 * 60 * 24 * 30)

    # If true, approvals must come from two separate users. If false, the same
    # user can approve their own request.
    PEER_APPROVAL_ENFORCED = values.BooleanValue(True)

    # Autograph settings
    AUTOGRAPH_URL = values.Value()
    AUTOGRAPH_HAWK_ID = values.Value()
    AUTOGRAPH_HAWK_SECRET_KEY = values.Value()
    AUTOGRAPH_SIGNATURE_MAX_AGE = values.IntegerValue(60 * 60 * 24 * 7)
    AUTOGRAPH_X5U_CACHE_BUST = values.Value(None)

    # How many days before expiration to warn for expired certificates
    CERTIFICATES_EXPIRE_EARLY_DAYS = values.IntegerValue(None)

    PROD_DETAILS_DIR = values.Value(os.path.join(Core.BASE_DIR, 'product_details'))

    # AWS settings
    AWS_ACCESS_KEY_ID = values.Value()
    AWS_SECRET_ACCESS_KEY = values.Value()
    AWS_STORAGE_BUCKET_NAME = values.Value()

    GITHUB_URL = values.Value('https://github.com/mozilla/normandy')


class Development(Base):
    """Settings for local development."""
    DOTENV_EXISTS = os.path.exists(os.path.join(Core.BASE_DIR, '.env'))
    DOTENV = '.env' if DOTENV_EXISTS else None

    SECRET_KEY = values.Value('not a secret')
    DEBUG = values.BooleanValue(True)
    AUTH_PASSWORD_VALIDATORS = values.ListValue([])
    INSTALLED_APPS = Base.INSTALLED_APPS + ['sslserver']
    EMAIL_BACKEND = values.Value('django.core.mail.backends.console.EmailBackend')
    SECURE_SSL_REDIRECT = values.Value(False)
    REQUIRE_RECIPE_AUTH = values.BooleanValue(False)
    PEER_APPROVAL_ENFORCED = values.BooleanValue(False)
    CSP_REPORT_URI = values.Value('')

    API_CACHE_ENABLED = values.BooleanValue(False)
    API_CACHE_TIME = values.IntegerValue(0)

    SWAGGER_SETTINGS = Base.SWAGGER_SETTINGS
    SWAGGER_SETTINGS['VALIDATOR_URL'] = None


class Production(Base):
    """Settings for the production environment."""
    USE_X_FORWARDED_HOST = values.BooleanValue(True)
    SECURE_PROXY_SSL_HEADER = values.TupleValue(('HTTP_X_FORWARDED_PROTO', 'https'))
    LOGGING_USE_JSON = values.Value(True)
    SECURE_HSTS_SECONDS = values.IntegerValue(31536000)  # 1 year
    DEFAULT_FILE_STORAGE = values.Value('storages.backends.s3boto3.S3Boto3Storage')
    AWS_S3_FILE_OVERWRITE = False


class ProductionReadOnly(Production):
    """
    Settings for a production environment that is read-only. This is
    used on public-facing webheads.
    """
    EXTRA_MIDDLEWARE = [
        # No need for sessions, so removing those middlewares helps us go fast
    ]
    ADMIN_ENABLED = values.BooleanValue(False)
    SILENCED_SYSTEM_CHECKS = values.ListValue([
        'security.W001',  # Security middle ware check
        'security.W003',  # CSRF middleware check
        'security.W017',  # Check CSRF cookie http only
    ])


class ProductionInsecure(Production):
    """
    Settings for a production-like environment that lacks many security features.

    Useful for testing and setups where security is provided by other means.
    Not intended for general use on the public internet.
    """
    INSTALLED_APPS = Production.INSTALLED_APPS + ['sslserver']
    SECRET_KEY = values.Value('not a secret')
    ALLOWED_HOSTS = values.ListValue(['*'])
    SECURE_SSL_REDIRECT = values.BooleanValue(False)
    CSRF_COOKIE_SECURE = values.BooleanValue(False)
    SECURE_HSTS_SECONDS = values.IntegerValue(0)
    SESSION_COOKIE_SECURE = values.BooleanValue(False)

    # These checks aren't useful for a purposefully insecure environment
    SILENCED_SYSTEM_CHECKS = values.ListValue([
        'security.W001',  # security middleware check
        'security.W004',  # check hsts seconds
        'security.W008',  # Secure SSL redirect
        'security.W009',  # Secret key length
        'security.W012',  # Check session cookie secure
        'security.W016',  # Check CSRF cookie secure
        'security.W017',  # Check CSRF cookie http only
    ])


class ProductionReadOnlyInsecure(ProductionInsecure, ProductionReadOnly):
    pass


class Build(Production):
    """Settings for building the Docker image for production."""
    SECRET_KEY = values.Value('not a secret')


class Test(Base):
    DOTENV_EXISTS = os.path.exists(os.path.join(Core.BASE_DIR, '.env'))
    DOTENV = '.env' if DOTENV_EXISTS else None
    SECRET_KEY = 'not a secret'
    DEFAULT_FILE_STORAGE = 'inmemorystorage.InMemoryStorage'
    SECURE_SSL_REDIRECT = False
    AUTOGRAPH_URL = None
    AUTOGRAPH_HAWK_ID = None
    AUTOGRAPH_HAWK_SECRET_KEY = None

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
        'rest_framework',
        'rest_framework.authtoken',
        'reversion',
        'storages',
        'raven.contrib.django.raven_compat',
        'webpack_loader',

        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',
    ]

    # Middleware that ALL environments must have. See the Base class for
    # details.
    MIDDLEWARE_CLASSES = [
        'normandy.base.middleware.RequestReceivedAtMiddleware',
        'django.middleware.security.SecurityMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
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
                    'django.core.context_processors.static',
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
        'jexl': ['dist/*.js'],
    }

    REST_FRAMEWORK = {
        'DEFAULT_AUTHENTICATION_CLASSES': (
            'rest_framework.authentication.TokenAuthentication',
            'rest_framework.authentication.SessionAuthentication'
        ),
        'DEFAULT_FILTER_BACKENDS': ['rest_framework.filters.DjangoFilterBackend'],
        'TEST_REQUEST_DEFAULT_FORMAT': 'json',
        'DEFAULT_RENDERER_CLASSES': (
            'normandy.base.api.renderers.CanonicalJSONRenderer',
            'normandy.base.api.renderers.CustomBrowsableAPIRenderer',
        )
    }

    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'default',
        },
        'recipes': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'recipes',
            'TIMEOUT': values.IntegerValue(300, environ_name='CACHES_RECIPES_TIMEOUT'),
        },
    }

    WEBPACK_LOADER = {
        'DEFAULT': {
            'BUNDLE_DIR_NAME': 'bundles/',
            'STATS_FILE': os.path.join(BASE_DIR, 'webpack-stats.json')
        },
        'ACTIONS': {
            'BUNDLE_DIR_NAME': 'bundles/',
            'STATS_FILE': os.path.join(BASE_DIR, 'webpack-stats-actions.json')
        }
    }

    # Action names and the path they are located at.
    ACTIONS = {
        'console-log': os.path.join(BASE_DIR, 'client/actions/console-log'),
        'show-heartbeat': os.path.join(BASE_DIR, 'client/actions/show-heartbeat'),
    }


class Base(Core):
    """Settings that may change per-environment, some with defaults."""
    # General settings
    DEBUG = values.BooleanValue(False)
    ADMINS = values.SingleNestedListValue([])
    SILENCED_SYSTEM_CHECKS = values.ListValue([])

    # Middleware that _most_ environments will need. Subclasses can
    # override this list.
    EXTRA_MIDDLEWARE_CLASSES = [
        'django.contrib.sessions.middleware.SessionMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
    ]

    def MIDDLEWARE_CLASSES(self):
        """
        Determine middleware by combining the core set and
        per-environment set.
        """
        return Core.MIDDLEWARE_CLASSES + self.EXTRA_MIDDLEWARE_CLASSES

    LOGGING_USE_JSON = values.BooleanValue(False)

    def LOGGING(self):
        return {
            'version': 1,
            'disable_existing_loggers': True,
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
            },
        }

    # Remote services
    DATABASES = values.DatabaseURLValue('postgres://postgres@localhost/normandy')
    GEOIP2_DATABASE = values.Value(os.path.join(Core.BASE_DIR, 'GeoLite2-Country.mmdb'))
    # Email settings
    EMAIL_HOST_USER = values.Value()
    EMAIL_HOST = values.Value()
    EMAIL_PORT = values.IntegerValue(587)
    EMAIL_USE_TLS = values.BooleanValue(True)
    EMAIL_HOST_PASSWORD = values.Value()
    EMAIL_BACKEND = values.Value('django.core.mail.backends.smtp.EmailBackend')
    RAVEN_CONFIG = {
        'dsn': values.URLValue(None, environ_name='RAVEN_CONFIG_DSN'),
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
    CSRF_COOKIE_HTTPONLY = values.BooleanValue(True)
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

    STATICFILES_STORAGE = values.Value('whitenoise.django.GzipManifestStaticFilesStorage')
    # Overwrite old files when uploading media.
    DEFAULT_FILE_STORAGE = values.Value('storages.backends.overwrite.OverwriteStorage')
    # URL that the CDN exists at to front cached parts of the site, if any.
    CDN_URL = values.URLValue(None)

    # Normandy settings
    ADMIN_ENABLED = values.BooleanValue(True)
    ACTION_IMPLEMENTATION_CACHE_TIME = values.IntegerValue(60 * 60 * 24 * 365)
    NUM_PROXIES = values.IntegerValue(0)
    API_CACHE_TIME = values.IntegerValue(30)
    # Autograph settings
    AUTOGRAPH_URL = values.Value()
    AUTOGRAPH_HAWK_ID = values.Value()
    AUTOGRAPH_HAWK_SECRET_KEY = values.Value()
    AUTOGRAPH_SIGNATURE_MAX_AGE = values.IntegerValue(60 * 60 * 24 * 7)


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

    API_CACHE_TIME = values.IntegerValue(0)


class Production(Base):
    """Settings for the production environment."""
    USE_X_FORWARDED_HOST = values.BooleanValue(True)
    SECURE_PROXY_SSL_HEADER = values.TupleValue(('HTTP_X_FORWARDED_PROTO', 'https'))
    LOGGING_USE_JSON = values.Value(True)
    SECURE_HSTS_SECONDS = values.IntegerValue(15768000)  # Six months


class ProductionReadOnly(Production):
    """
    Settings for a production environment that is read-only. This is
    used on public-facing webheads.
    """
    EXTRA_MIDDLEWARE_CLASSES = []  # No need for sessions!
    ADMIN_ENABLED = values.BooleanValue(False)
    SILENCED_SYSTEM_CHECKS = values.ListValue(['security.W003'])  # CSRF check


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
        'security.W004',  # check hsts seconds
        'security.W008',  # Secure SSL redirect
        'security.W009',  # Secret key length
        'security.W012',  # Check session cookie secure
        'security.W016',  # Check CSRF cookie secure
    ])


class Build(Production):
    """Settings for building the Docker image for production."""
    SECRET_KEY = values.Value('not a secret')


class Test(Base):
    DOTENV_EXISTS = os.path.exists(os.path.join(Core.BASE_DIR, '.env'))
    DOTENV = '.env' if DOTENV_EXISTS else None
    SECRET_KEY = 'not a secret'
    DEFAULT_FILE_STORAGE = 'inmemorystorage.InMemoryStorage'
    SECURE_SSL_REDIRECT = False
    STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

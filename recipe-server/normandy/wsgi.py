import os

from configurations.wsgi import get_wsgi_application
from whitenoise.django import DjangoWhiteNoise


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "normandy.settings")
os.environ.setdefault('DJANGO_CONFIGURATION', 'Production')


application = DjangoWhiteNoise(get_wsgi_application())

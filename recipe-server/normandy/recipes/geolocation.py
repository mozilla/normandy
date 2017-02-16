import logging

from django.conf import settings

from geoip2.database import Reader
from geoip2.errors import GeoIP2Error, AddressNotFoundError


WARNING_CANNOT_LOAD_DATABASE = 'normandy.geolocation.W001'
WARNING_UNKNOWN_GEOIP_ERROR = 'normandy.geolocation.W002'


log = logging.getLogger(__name__)


#: Shared instance of the GeoIP2 database reader.
geoip_reader = None


def load_geoip_database():
    global geoip_reader

    try:
        geoip_reader = Reader(settings.GEOIP2_DATABASE)
    except IOError:
        log.warning(
            'Geolocation is disabled: Cannot load database.',
            extra={'code': WARNING_CANNOT_LOAD_DATABASE}
        )


def get_country_code(ip_address):
    if geoip_reader and ip_address:
        try:
            return geoip_reader.country(ip_address).country.iso_code
        except AddressNotFoundError:
            pass
        except GeoIP2Error as exc:
            log.warning(exc, extra={'code': WARNING_UNKNOWN_GEOIP_ERROR})
            pass

    return None

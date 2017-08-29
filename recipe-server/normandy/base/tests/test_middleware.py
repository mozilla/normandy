from random import randint

from normandy.base.middleware import NormandyCommonMiddleware


class TestNormandyCommonMiddleware(object):

    def test_append_slash_redirects_with_cache_headers(self, rf, settings):
        cache_time = randint(100, 1000)
        # This must be a URL that is valid with a slash but not without a slash
        url = '/api/v1'
        settings.APPEND_SLASH = True
        settings.PERMANENT_REDIRECT_CACHE_TIME = cache_time

        middleware = NormandyCommonMiddleware()
        req = rf.get(url)
        res = middleware.process_request(req)

        assert res is not None
        assert res.status_code == 301
        assert res['Location'] == url + '/'
        cache_control = set(res['Cache-Control'].split(', '))
        assert cache_control == {'public', f'max-age={cache_time}'}

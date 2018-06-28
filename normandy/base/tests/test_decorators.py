from django.http import HttpResponse

from normandy.base.decorators import api_cache_control


class TestApiCacheControl(object):
    def test_cache_enabled(self, settings, rf):
        settings.API_CACHE_ENABLED = True
        settings.API_CACHE_TIME = 66

        @api_cache_control()
        def view(request):
            return HttpResponse()

        response = view(rf.get("/foo/bar"))
        assert "public" in response["Cache-Control"]
        assert "max-age=66" in response["Cache-Control"]

    def test_cache_disabled(self, settings, rf):
        settings.API_CACHE_ENABLED = False
        settings.API_CACHE_TIME = 66

        @api_cache_control()
        def view(request):
            return HttpResponse()

        response = view(rf.get("/foo/bar"))
        assert "public" not in response["Cache-Control"]
        assert "max-age=" not in response["Cache-Control"]
        assert "no-cache" in response["Cache-Control"]
        assert "no-store" in response["Cache-Control"]
        assert "must-revalidate" in response["Cache-Control"]

    def test_cache_custom(self, settings, rf):
        settings.API_CACHE_ENABLED = True
        settings.API_CACHE_TIME = 66

        @api_cache_control(max_age=44, no_transform=True)
        def view(request):
            return HttpResponse()

        response = view(rf.get("/foo/bar"))
        assert "public" in response["Cache-Control"]
        assert "max-age=44" in response["Cache-Control"]
        assert "no-transform" in response["Cache-Control"]

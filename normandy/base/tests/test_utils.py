import json

from normandy.base.utils import canonical_json_dumps, get_client_ip, sri_hash


class TestGetClientIp(object):
    def test_no_proxies(self, rf, settings):
        """If there are no proxies, REMOTE_ADDR should be used."""
        settings.NUM_PROXIES = 0
        client_ip = "1.1.1.1"
        req = rf.get("/", HTTP_X_FORWARDED_FOR="fake", REMOTE_ADDR=client_ip)
        assert get_client_ip(req) == client_ip

    def test_one_proxy(self, rf, settings):
        """
        If there is one proxy, the right-most value in HTTP_X_FORWARDED_FOR
        should be used.
        """
        settings.NUM_PROXIES = 1
        client_ip = "1.1.1.1"
        nginx_ip = "2.2.2.2"
        forwarded_for = ", ".join(["fake", client_ip])
        req = rf.get("/", HTTP_X_FORWARDED_FOR=forwarded_for, REMOTE_ADDR=nginx_ip)
        assert get_client_ip(req) == client_ip

    def test_two_proxies(self, rf, settings):
        """
        If there are two proxies, the second-from-the-right value in
        HTTP_X_FORWARDED_FOR should be used.
        """
        settings.NUM_PROXIES = 2
        client_ip = "1.1.1.1"
        elb_ip = "2.2.2.2"
        nginx_ip = "3.3.3.3"
        forwarded_for = ", ".join(["fake", client_ip, elb_ip])
        req = rf.get("/", HTTP_X_FORWARDED_FOR=forwarded_for, REMOTE_ADDR=nginx_ip)
        assert get_client_ip(req) == client_ip


class TestCanonicalJsonDumps(object):
    def test_it_works(self):
        data = {"a": 1, "b": 2}
        assert canonical_json_dumps(data) == '{"a":1,"b":2}'

    def test_it_works_with_euro_signs(self):
        data = {"USD": "$", "EURO": "€"}
        assert canonical_json_dumps(data) == r'{"EURO":"\u20ac","USD":"$"}'

    def test_it_escapes_quotes_properly(self):
        data = {"message": 'It "works", I think'}
        dumped = canonical_json_dumps(data)
        assert dumped == r'{"message":"It \"works\", I think"}'
        json.loads(dumped)


class TestSRIHash(object):
    def test_it_works(self):
        # Pre-generated base64 hash of the string "foobar"
        expected = "sha384-PJww2fZl501RXIQpYNSkUcg6ASX9Pec5LXs3IxrxDHLqWK7fzfiaV2W/kCr5Ps8G"
        assert sri_hash(b"foobar") == expected

    def test_url_safe_works(self):
        # Pre-generated base64 hash of the string "normandy", urlsafe-ed
        expected = "sha384-6FydcL0iVnTqXT3rBg6YTrlz0K-mw57n9zxTEmxYG6FIO_vZTMlTWsbkxHchsO65"
        assert sri_hash(b"normandy", url_safe=True) == expected

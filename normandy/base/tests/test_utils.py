from normandy.base.utils import get_client_ip


class TestGetClientIp(object):
    def test_no_proxies(self, rf, settings):
        """If there are no proxies, REMOTE_ADDR should be used."""
        settings.NUM_PROXIES = 0
        client_ip = '1.1.1.1'
        req = rf.get('/', HTTP_X_FORWARDED_FOR='fake', REMOTE_ADDR=client_ip)
        assert get_client_ip(req) == client_ip

    def test_one_proxy(self, rf, settings):
        """
        If there is one proxy, the right-most value in HTTP_X_FORWARDED_FOR
        should be used.
        """
        settings.NUM_PROXIES = 1
        client_ip = '1.1.1.1'
        nginx_ip = '2.2.2.2'
        forwarded_for = ', '.join(['fake', client_ip])
        req = rf.get('/', HTTP_X_FORWARDED_FOR=forwarded_for, REMOTE_ADDR=nginx_ip)
        assert get_client_ip(req) == client_ip

    def test_two_proxies(self, rf, settings):
        """
        If there are two proxies, the second-from-the-right value in
        HTTP_X_FORWARDED_FOR should be used.
        """
        settings.NUM_PROXIES = 2
        client_ip = '1.1.1.1'
        elb_ip = '2.2.2.2'
        nginx_ip = '3.3.3.3'
        forwarded_for = ', '.join(['fake', client_ip, elb_ip])
        req = rf.get('/', HTTP_X_FORWARDED_FOR=forwarded_for, REMOTE_ADDR=nginx_ip)
        assert get_client_ip(req) == client_ip

import pytest

from normandy.base.templatetags.normandy_webpack_loader import render_bundle


class TestRenderBundle(object):
    @pytest.fixture
    def js_file(self, tmpdir):
        js_file = tmpdir.join('file.js')
        js_file.write('console.log("test");')
        return js_file

    @pytest.fixture
    def css_file(self, tmpdir):
        css_file = tmpdir.join('file.css')
        css_file.write('html { padding: 10px; }')
        return css_file

    @pytest.fixture
    def mock_get_files(self, mocker, js_file, css_file):
        get_files = mocker.patch('normandy.base.templatetags.normandy_webpack_loader.get_files')
        get_files.return_value = [
            {'path': js_file.strpath, 'name': 'file.js', 'url': 'file.js'},
            {'path': css_file.strpath, 'name': 'file.css', 'url': 'file.css'},
        ]
        return get_files

    @pytest.fixture
    def mock_sri_hash(self, mocker):
        sri_hash = mocker.patch('normandy.base.templatetags.normandy_webpack_loader.sri_hash')
        sri_hash.side_effect = lambda data: 'hash({})'.format(data.decode())
        return sri_hash

    def test_empty_html(self, mock_get_files, mock_sri_hash):
        mock_get_files.return_value = []
        assert render_bundle('fakebundle') == ''

    def test_html(self, js_file, css_file, mock_get_files, mock_sri_hash):
        html = render_bundle('fakebundle', extension='all', config='fake', attrs='foo="bar"')
        mock_get_files.assert_called_with('fakebundle', extension='all', config='fake')

        script_tag = (
            '<script type="text/javascript" src="file.js" integrity="hash({})" foo="bar">'
            '</script>'
        ).format(js_file.read())
        assert script_tag in html

        link_tag = (
            '<link type="text/css" href="file.css" rel="stylesheet" integrity="hash({})" '
            'foo="bar"/>'
        ).format(css_file.read())
        assert link_tag in html

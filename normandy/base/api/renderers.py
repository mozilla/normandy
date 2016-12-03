import canonicaljson
from rest_framework import renderers


class TextRenderer(renderers.BaseRenderer):
    media_type = 'text/plain'
    format = 'txt'

    def render(self, data, media_type=None, renderer_context=None):
        response = renderer_context.get('response') if renderer_context else None
        if response and response.exception:
            data = self.render_error(data)

        return data.encode(self.charset)

    def render_error(self, data):
        return data['detail']


class JavaScriptRenderer(TextRenderer):
    media_type = 'application/javascript'
    format = 'js'

    def render_error(self, data):
        return '/* {} */'.format(super().render_error(data))


class CanonicalJSONRenderer(renderers.BaseRenderer):
    media_type = 'application/json'
    format = 'json'
    charset = None

    def render(self, data, media_type=None, renderer_context=None):
        # Get canonical json as bytes
        rendered = canonicaljson.encode_canonical_json(data)
        # Convert to a unicode string
        rendered = rendered.decode('utf8')
        # Encode *all* unicode characters as \u1234 escapes (and convert to bytes)
        return rendered.encode('unicode_escape')


class CustomBrowsableAPIRenderer(renderers.BrowsableAPIRenderer):
    def get_default_renderer(self, view):
        return renderers.JSONRenderer()

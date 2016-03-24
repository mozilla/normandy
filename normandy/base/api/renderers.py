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

from rest_framework import renderers


class TextRenderer(renderers.BaseRenderer):
    media_type = 'text/plain'
    format = 'txt'

    def render(self, data, media_type=None, renderer_context=None):
        return data.encode(self.charset)


class JavaScriptRenderer(TextRenderer):
    media_type = 'application/javascript'
    format = 'js'

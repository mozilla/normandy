import json

from django.template import Node
from django.template import Library
from django.utils.safestring import mark_safe

from normandy.base.api.serializers import UserSerializer


register = Library()


@register.tag
def app_data(parser, token):
    return AppDataNode()


class AppDataNode(Node):
    def render(self, context):
        user = context.request.user

        data = {
            'user': UserSerializer(user).data,
        }

        return mark_safe('<script type="application/json" id="app-data">{data}</script>'
                         .format(data=json.dumps(data)))

from django import template
from django.utils.safestring import mark_safe

from webpack_loader.templatetags.webpack_loader import get_files

from normandy.base.utils import sri_hash


register = template.Library()


@register.simple_tag
def render_bundle(bundle_name, extension=None, config="DEFAULT", attrs=""):
    """
    Modified version of webpack_loader's render_bundle that adds hashes
    to tags for subresource integrity.
    """
    tags = []
    chunks = get_files(bundle_name, extension=extension, config=config)
    for chunk in chunks:
        with open(chunk["path"], "rb") as f:
            chunk_hash = sri_hash(f.read())
        if chunk["name"].endswith(".js"):
            tags.append(
                (
                    '<script type="text/javascript" src="{0}" integrity="{1}" '
                    'crossorigin="anonymous" {2}></script>'
                ).format(chunk["url"], chunk_hash, attrs)
            )
        elif chunk["name"].endswith(".css"):
            tags.append(
                (
                    '<link type="text/css" href="{0}" rel="stylesheet" integrity="{1}" '
                    'crossorigin="anonymous" {2}/>'
                ).format(chunk["url"], chunk_hash, attrs)
            )
    return mark_safe("\n".join(tags))

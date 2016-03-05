from django import template


register = template.Library()


@register.inclusion_tag('admin/classifier/form_field.html')
def form_field(field):
    return {'field': field}

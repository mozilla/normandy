from django.db import models
from django.template.loader import render_to_string

from normandy.recipes.models import Recipe


class Extension(models.Model):
    name = models.CharField(max_length=255)
    xpi = models.FileField(upload_to='extensions')

    @property
    def recipes_used_by(self):
        """Set of enabled recipes that are using this extension."""
        return Recipe.objects.filter(
            latest_revision__arguments_json__contains=self.xpi.url,
        )

    def recipes_used_by_html(self):
        return render_to_string('admin/field_recipe_list.html', {
            'recipes': self.recipes_used_by.order_by('latest_revision__name'),
        })
    recipes_used_by_html.short_description = 'Used in Recipes'

from django.contrib import admin
from django.template.loader import render_to_string

from normandy.recipes import models
from normandy.recipes.forms import ActionAdminForm, RecipeAdminForm

from reversion.admin import VersionAdmin


@admin.register(models.Recipe)
class RecipeAdmin(VersionAdmin):
    form = RecipeAdminForm
    save_as = True
    list_display = [
        'name',
        'enabled',
        'action',
        'filter_expression',
    ]
    search_fields = ['name']

    list_filter = [
        ('enabled', admin.BooleanFieldListFilter),
        ('action', admin.RelatedOnlyFieldListFilter),
    ]

    fieldsets = [
        [None, {
            'fields': ['name', 'enabled', 'filter_expression']
        }],
        ['Action', {
            'fields': [
                'action',
                'arguments_json',
            ],
        }],
    ]


@admin.register(models.Action)
class ActionAdmin(VersionAdmin):
    form = ActionAdminForm
    list_display = ['name', 'implementation_hash', 'in_use']
    fieldsets = [
        [None, {
            'fields': [
                'name',
                'implementation_hash',
                'implementation',
                'arguments_schema_json',
                'recipe_list',
            ]
        }],
    ]

    readonly_fields = ['implementation_hash', 'recipe_list']

    def recipe_list(self, action):
        """List all recipes that the action is being used by."""
        return render_to_string('admin/field_recipe_list.html', {
            'recipes': action.recipes_used_by.order_by('name'),
        })
    recipe_list.short_description = 'Used in Recipes'

    def in_use(self, action):
        """
        Wrapper around the Action.in_use property so that we can set the
        boolean attribute to display a nice checkmark for the field in
        the admin.
        """
        return action.in_use
    in_use.boolean = True

from django.contrib import admin
from django.template.loader import render_to_string

from normandy.base.admin import site as admin_site
from normandy.recipes import models
from normandy.recipes.forms import ActionAdminForm, RecipeAdminForm

from reversion.admin import VersionAdmin


@admin.register(models.Recipe, site=admin_site)
class RecipeAdmin(VersionAdmin):
    form = RecipeAdminForm
    save_as = True
    list_display = [
        'name',
        'enabled',
        'action',
        'get_locales_display',
        'get_countries_display',
        'start_time',
        'end_time',
    ]
    search_fields = ['name', 'locales', 'countries']
    filter_horizontal = ['locales', 'countries']

    list_filter = [
        ('enabled', admin.BooleanFieldListFilter),
        ('locales', admin.RelatedOnlyFieldListFilter),
        ('countries', admin.RelatedOnlyFieldListFilter),
        ('action', admin.RelatedOnlyFieldListFilter),
    ]

    fieldsets = [
        [None, {
            'fields': ['name']
        }],
        ['Action', {
            'fields': [
                'action',
                'arguments_json',
            ],
        }],
        ['Delivery Rules', {
            'fields': [
                'enabled',
                'sample_rate',
                'start_time',
                'end_time',
                'locales',
                'countries',
                'release_channels',
            ],
        }],

    ]


@admin.register(models.Action, site=admin_site)
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


@admin.register(models.ReleaseChannel)
class ReleaseChannelAdmin(admin.ModelAdmin):
    fields = ['name', 'slug']

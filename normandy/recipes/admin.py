from django.contrib import admin
from django.contrib.postgres.fields import JSONField
from django.forms import widgets

from adminsortable.admin import NonSortableParentAdmin, SortableTabularInline

from normandy.recipes import models


admin.site.site_header = 'SHIELD Server Admin'
admin.site.site_title = 'SHIELD Server Admin'


class RecipeActionInline(SortableTabularInline):
    model = models.RecipeAction
    extra = 0
    formfield_overrides = {
        JSONField: {'widget': widgets.TextInput}
    }


@admin.register(models.Recipe)
class RecipeAdmin(NonSortableParentAdmin):
    list_display = ['name', 'enabled', 'locale', 'country', 'start_time', 'end_time']
    list_filter = ['enabled', 'locale', 'country']
    search_fields = ['name', 'locale', 'country']
    inlines = [RecipeActionInline]

    fieldsets = [
        [None, {
            'fields': ['name']
        }],
        ['Delivery Rules', {
            'fields': [
              'enabled',
              'locale',
              'country',
              'sample_rate',
              'start_time',
              'end_time',
              'count_limit',
            ]
        }],
    ]


@admin.register(models.Action)
class ActionAdmin(admin.ModelAdmin):
    list_display = ['name', 'implementation_hash']
    fieldsets = [
        [None, {
            'fields': ['name', 'implementation_hash', 'implementation']
        }],
    ]

    readonly_fields = ['implementation_hash']

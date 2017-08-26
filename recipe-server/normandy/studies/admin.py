from django.contrib import admin

from normandy.studies import models


@admin.register(models.Extension)
class ExtensionAdmin(admin.ModelAdmin):
    list_display = ['name', 'xpi']
    fieldsets = [
        [None, {
            'fields': [
                'name',
                'xpi',
                'recipes_used_by_html',
            ]
        }],
    ]

    readonly_fields = ['recipes_used_by_html']

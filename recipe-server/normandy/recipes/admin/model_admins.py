from django.contrib import admin

from normandy.recipes import models


@admin.register(models.Action)
class ActionAdmin(admin.ModelAdmin):
    list_display = ['name', 'implementation_hash']
    fieldsets = [
        [None, {
            'fields': [
                'name',
                'implementation_hash',
                'implementation',
                'arguments_schema_json',
                'recipes_used_by_html',
            ],
        }],
    ]

    readonly_fields = ['implementation_hash', 'recipes_used_by_html']

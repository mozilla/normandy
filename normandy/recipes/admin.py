from django.contrib import admin

from normandy.recipes import models


admin.site.site_header = 'SHIELD Server Admin'
admin.site.site_title = 'SHIELD Server Admin'


@admin.register(models.Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ['filename', 'enabled', 'locale', 'country', 'start_time', 'end_time']
    list_filter = ['enabled', 'locale', 'country']
    search_fields = ['filename', 'locale', 'country']

    fieldsets = [
        [None, {
            'fields': ['filename', 'content', 'content_hash']
        }],
        ['Delivery Rules', {
            'fields': ['enabled', 'locale', 'country', 'sample_rate', 'start_time', 'end_time']
        }],
    ]
    readonly_fields = ['content_hash']

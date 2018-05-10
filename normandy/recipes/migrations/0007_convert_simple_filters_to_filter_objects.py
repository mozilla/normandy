import json

from django.db import migrations


def simple_filters_to_filter_objects(apps, schema_editor):
    RecipeRevision = apps.get_model('recipes', 'RecipeRevision')
    for revision in RecipeRevision.objects.all():
        filter_object = []

        if revision.locales.count():
            filter_object.append({
                'type': 'locale',
                'locales': [l.code for l in revision.locales.all()],
            })
            revision.locales.set([])

        if revision.countries.count():
            filter_object.append({
                'type': 'country',
                'countries': [c.code for c in revision.countries.all()],
            })
            revision.countries.set([])

        if revision.channels.count():
            filter_object.append({
                'type': 'channel',
                'channels': [c.slug for c in revision.channels.all()],
            })
            revision.channels.set([])

        if filter_object:
            revision.filter_object_json = json.dumps(filter_object)
            revision.save()


def filter_objects_to_simple_filters(apps, schema_editor):
    RecipeRevision = apps.get_model('recipes', 'RecipeRevision')
    Channel = apps.get_model('recipes', 'Channel')
    Country = apps.get_model('recipes', 'Country')
    Locale = apps.get_model('recipes', 'Locale')

    for revision in RecipeRevision.objects.all():
        filter_object = json.loads(revision.filter_object_json)
        remaining_filters = []

        for filter in filter_object:
            if filter['type'] == 'channel':
                revision.channels.set([Channel.objects.get(slug=c) for c in filter['channels']])
            elif filter['type'] == 'country':
                revision.countries.set([Country.objects.get(code=c) for c in filter['countries']])
            elif filter['type'] == 'locale':
                revision.locales.set([Locale.objects.get(code=l) for l in filter['locales']])
            else:
                remaining_filters.append(filter)

        if remaining_filters:
            revision.filter_object_json = json.dumps(remaining_filters)
        else:
            revision.filter_object_json = None

        revision.save()


class Migration(migrations.Migration):
    dependencies = [
        ('recipes', '0006_reciperevision_filter_object_json'),
    ]

    operations = [
        migrations.RunPython(simple_filters_to_filter_objects, filter_objects_to_simple_filters),
    ]

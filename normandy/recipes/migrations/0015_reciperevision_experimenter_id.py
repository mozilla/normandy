# Generated by Django 2.1.7 on 2019-03-07 17:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("recipes", "0014_auto_20190228_1128")]

    operations = [
        migrations.AddField(
            model_name="reciperevision",
            name="experimenter_id",
            field=models.IntegerField(null=True),
        )
    ]

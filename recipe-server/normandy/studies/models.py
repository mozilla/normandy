from django.db import models


class Extension(models.Model):
    name = models.CharField(max_length=255)
    xpi = models.FileField(upload_to='extensions')

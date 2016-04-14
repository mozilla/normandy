from django.db import transaction

from reversion import revisions as reversion


class RevisionMixin(object):
    """
    ViewSet mixin that creates revisions when objects are created,
    modified, or deleted.
    """
    @transaction.atomic()
    @reversion.create_revision()
    def create(self, *args, **kwargs):
        return super().create(*args, **kwargs)

    @transaction.atomic()
    @reversion.create_revision()
    def update(self, *args, **kwargs):
        return super().update(*args, **kwargs)

    @transaction.atomic()
    @reversion.create_revision()
    def delete(self, *args, **kwargs):
        return super().delete(*args, **kwargs)

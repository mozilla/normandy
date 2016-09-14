from datetime import datetime

import pytest

from normandy.recipes.tests import ActionFactory, RecipeFactory


@pytest.mark.django_db
class TestActionFactory(object):
    def test_it_gets_the_right_hash(self):
        a = ActionFactory.build()
        old_hash = a.implementation_hash
        a.save()
        assert a.implementation_hash == old_hash


@pytest.mark.django_db
class TestRecipeFactory:
    def test_signed_false(self):
        r = RecipeFactory(signed=False)
        assert r.signature is None

    def test_signed_true(self):
        r = RecipeFactory(signed=True)
        assert r.signature is not None
        assert len(r.signature.signature) == 128
        assert isinstance(r.signature.timestamp, datetime)

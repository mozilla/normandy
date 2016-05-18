import pytest

from normandy.recipes.tests import ActionFactory


@pytest.mark.django_db
class TestActionFactory(object):
    def test_it_gets_the_right_hash(self):
        a = ActionFactory.build()
        old_hash = a.implementation_hash
        a.save()
        assert a.implementation_hash == old_hash

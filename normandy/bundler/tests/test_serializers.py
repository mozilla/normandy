import pytest

from normandy.bundler.tests import BundleFactory
from normandy.bundler.serializers import BundleSerializer
from normandy.recipes.tests import RecipeFactory


@pytest.mark.django_db()
def test_bundle_serializer():
    recipe = RecipeFactory()
    bundle = BundleFactory(recipes=[recipe])
    serializer = BundleSerializer(bundle)

    assert len(serializer.data['recipes']) == 1
    assert serializer.data['recipes'][0] == {'name': recipe.name, 'actions': []}

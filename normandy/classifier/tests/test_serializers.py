import pytest

from normandy.base.tests import Whatever
from normandy.classifier.tests import BundleFactory
from normandy.classifier.serializers import BundleSerializer
from normandy.recipes.tests import RecipeFactory


@pytest.mark.django_db()
def test_bundle_serializer(rf):
    recipe = RecipeFactory()
    bundle = BundleFactory(recipes=[recipe])
    serializer = BundleSerializer(bundle, context={'request': rf.get('/')})

    assert serializer.data['recipes'] == [{
        'name': recipe.name,
        'id': recipe.id,
        'revision_id': recipe.revision_id,
        'action': Whatever(),
        'arguments': Whatever(),
    }]

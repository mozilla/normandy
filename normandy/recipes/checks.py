from django.apps import apps
from django.db.utils import OperationalError, ProgrammingError
from django.core.checks import Warning, Info, register as register_check
from django.core.exceptions import ImproperlyConfigured

from normandy.recipes.utils import verify_signature


INFO_COULD_NOT_RETRIEVE_ACTIONS = 'normandy.recipes.I001'
INFO_COULD_NOT_RETRIEVE_RECIPES = 'normandy.recipes.I002'
WARNING_MISMATCHED_ACTION_HASH = 'normandy.recipes.W001'
WARNING_INVALID_RECIPE_SIGNATURE = 'normandy.recipes.W002'


def actions_have_consistent_hashes(app_configs, **kwargs):
    errors = []
    try:
        Action = apps.get_model('recipes', 'Action')
        actions = list(Action.objects.all())
    except (ProgrammingError, OperationalError, ImproperlyConfigured):
        errors.append(Info('Could not retrieve actions', id=INFO_COULD_NOT_RETRIEVE_ACTIONS))
    else:
        for action in actions:
            if action.compute_implementation_hash() != action.implementation_hash:
                msg = ("Action '{action}' (id={action.id}) has a mismatched hash"
                       .format(action=action))
                errors.append(Warning(msg, id=WARNING_MISMATCHED_ACTION_HASH))

    return errors


def recipe_signatures_are_correct(app_configs, **kwargs):
    errors = []
    try:
        Recipe = apps.get_model('recipes', 'Recipe')
        signed_recipes = list(Recipe.objects.exclude(signature=None))
    except (ProgrammingError, OperationalError, ImproperlyConfigured):
        errors.append(Info('Could not retrieve recipes', id=INFO_COULD_NOT_RETRIEVE_RECIPES))
    else:
        for recipe in signed_recipes:
            data = recipe.canonical_json()
            signature = recipe.signature.signature
            pubkey = recipe.signature.pubkey
            if not verify_signature(data, signature, pubkey):
                msg = ("Recipe '{recipe}' (id={recipe.id}) has a bad signature"
                       .format(recipe=recipe))
                errors.append(Warning(msg, id=WARNING_INVALID_RECIPE_SIGNATURE))

    return errors


def register():
    register_check(actions_have_consistent_hashes)
    register_check(recipe_signatures_are_correct)

from datetime import timedelta

from django.apps import apps
from django.conf import settings
from django.core.checks import Warning, Info, register as register_check
from django.core.exceptions import ImproperlyConfigured
from django.db.utils import OperationalError, ProgrammingError

from normandy.recipes import signing


INFO_COULD_NOT_RETRIEVE_ACTIONS = 'normandy.recipes.I001'
INFO_COULD_NOT_RETRIEVE_RECIPES = 'normandy.recipes.I002'
WARNING_MISMATCHED_ACTION_HASH = 'normandy.recipes.W001'
WARNING_INVALID_RECIPE_SIGNATURE = 'normandy.recipes.W002'
WARNING_BAD_SIGNING_CERTIFICATE = 'normandy.recipes.W003'


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
            pubkey = recipe.signature.public_key
            try:
                signing.verify_signature(data, signature, pubkey)
            except signing.BadSignature as e:
                msg = ("Recipe '{recipe}' (id={recipe.id}) has a bad signature: {detail}"
                       .format(recipe=recipe, detail=e.detail))
                errors.append(Warning(msg, id=WARNING_INVALID_RECIPE_SIGNATURE))

    return errors


def recipe_signatures_use_good_certificates(app_configs, **kwargs):
    errors = []
    expire_early = None
    if settings.CERTIFICATES_EXPIRE_EARLY_DAYS:
        expire_early = timedelta(days=settings.CERTIFICATES_EXPIRE_EARLY_DAYS)

    try:
        Recipe = apps.get_model('recipes', 'Recipe')
        signed_recipes = list(Recipe.objects.exclude(signature=None))
    except (ProgrammingError, OperationalError, ImproperlyConfigured):
        errors.append(Info('Could not retrieve recipes', id=INFO_COULD_NOT_RETRIEVE_RECIPES))
    else:
        urls = set(r.signature.x5u for r in signed_recipes)
        for url in urls:
            try:
                signing.verify_x5u(url, expire_early)
            except signing.BadCertificate as exc:
                matching_recipes = Recipe.objects.filter(signature__x5u=url)
                count = matching_recipes.count()
                ids = ', '.join(str(r.id) for r in matching_recipes)
                msg = (f'{count} recipes (ids {ids}) are signed with a bad cert. {exc.detail}. '
                       f'Certificate url is {url}')
                errors.append(Warning(msg, id=WARNING_BAD_SIGNING_CERTIFICATE))

    return errors


def register():
    register_check(actions_have_consistent_hashes)
    register_check(recipe_signatures_are_correct)
    register_check(recipe_signatures_use_good_certificates)

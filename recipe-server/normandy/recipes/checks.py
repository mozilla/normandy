from datetime import timedelta

from django.apps import apps
from django.conf import settings
from django.core.checks import Warning, Info, register as register_check
from django.core.exceptions import ImproperlyConfigured
from django.db.utils import OperationalError, ProgrammingError

from normandy.recipes import signing


INFO_COULD_NOT_RETRIEVE_ACTIONS = 'normandy.recipes.I001'
INFO_COULD_NOT_RETRIEVE_RECIPES = 'normandy.recipes.I002'
INFO_COULD_NOT_RETRIEVE_SIGNATURES = 'normandy.recipes.I003'
WARNING_MISMATCHED_ACTION_HASH = 'normandy.recipes.W001'
WARNING_INVALID_RECIPE_SIGNATURE = 'normandy.recipes.W002'
WARNING_BAD_SIGNING_CERTIFICATE = 'normandy.recipes.W003'
WARNING_INVALID_ACTION_SIGNATURE = 'normandy.recipes.W004'


def actions_have_consistent_hashes(app_configs, **kwargs):
    errors = []
    try:
        Action = apps.get_model('recipes', 'Action')
        actions = list(Action.objects.all())
    except (ProgrammingError, OperationalError, ImproperlyConfigured) as e:
        errors.append(Info(f'Could not retrieve actions: {e}', id=INFO_COULD_NOT_RETRIEVE_ACTIONS))
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
    except (ProgrammingError, OperationalError, ImproperlyConfigured) as e:
        errors.append(Info(f'Could not retrieve recipes: {e}', id=INFO_COULD_NOT_RETRIEVE_RECIPES))
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


def action_signatures_are_correct(app_configs, **kwargs):
    errors = []
    try:
        Action = apps.get_model('recipes', 'Action')
        signed_actions = list(Action.objects.exclude(signature=None))
    except (ProgrammingError, OperationalError, ImproperlyConfigured) as e:
        msg = f'Could not retrieve actions: f{e}'
        errors.append(Info(msg, id=INFO_COULD_NOT_RETRIEVE_ACTIONS))
    else:
        for action in signed_actions:
            data = action.canonical_json()
            signature = action.signature.signature
            pubkey = action.signature.public_key
            try:
                signing.verify_signature(data, signature, pubkey)
            except signing.BadSignature as e:
                msg = f"Action '{action}' (id={action.id}) has a bad signature: {e.detail}"
                errors.append(Warning(msg, id=WARNING_INVALID_ACTION_SIGNATURE))

    return errors


def signatures_use_good_certificates(app_configs, **kwargs):
    errors = []
    expire_early = None
    if settings.CERTIFICATES_EXPIRE_EARLY_DAYS:
        expire_early = timedelta(days=settings.CERTIFICATES_EXPIRE_EARLY_DAYS)

    try:
        Signature = apps.get_model('recipes', 'Signature')
        Recipe = apps.get_model('recipes', 'Recipe')
        Action = apps.get_model('recipes', 'Action')
        signatures = list(Signature.objects.all())
    except (ProgrammingError, OperationalError, ImproperlyConfigured) as e:
        msg = f'Could not retrieve signatures: {e}'
        errors.append(Info(msg, id=INFO_COULD_NOT_RETRIEVE_SIGNATURES))
    else:
        urls = set(s.x5u for s in signatures)
        for url in urls:
            try:
                signing.verify_x5u(url, expire_early)
            except signing.BadCertificate as exc:
                matching_recipes = Recipe.objects.filter(signature__x5u=url)
                matching_actions = Action.objects.filter(signature__x5u=url)
                bad_objects = list(matching_recipes) + list(matching_actions)

                object_names = ', '.join(bad_objects)
                msg = (f'{len(bad_objects)} objects are signed with a bad cert: {object_names}. '
                       f'{exc.detail}. Certificate url is {url}. ')
                errors.append(Warning(msg, id=WARNING_BAD_SIGNING_CERTIFICATE))

    return errors


def register():
    register_check(actions_have_consistent_hashes)
    # Temporarily disabled, see Issue #900.
    # register_check(recipe_signatures_are_correct)
    # register_check(action_signatures_are_correct)
    register_check(signatures_use_good_certificates)

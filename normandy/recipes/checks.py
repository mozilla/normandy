from django.apps import apps
from django.db.utils import OperationalError
from django.core.checks import Warning, Info, register as register_check
from django.template.defaultfilters import pluralize


INFO_COULD_NOT_RETRIEVE_ACTIONS = 'normandy.recipes.I001'
WARNING_MISMATCHED_ACTION_HASH = 'normandy.recipes.W001'


def actions_have_consistent_hashes(app_configs, **kwargs):
    errors = []
    try:
        Action = apps.get_model('recipes', 'Action')
        actions = list(Action.objects.all())
    except OperationalError:
        errors.append(Info('Could not retrieve actions', id=INFO_COULD_NOT_RETRIEVE_ACTIONS))
    else:
        bad_actions = []
        for action in actions:
            if action.compute_implementation_hash() != action.implementation_hash:
                bad_actions.append(action)

        for action in bad_actions:
            msg = "Action '{action}' (id={action.id}) has a mismatched hash".format(action=action)
            errors.append(Warning(msg, id=WARNING_MISMATCHED_ACTION_HASH))

    return errors


def register():
    register_check(actions_have_consistent_hashes)

from rest_framework import exceptions, status


class MidairCollisionError(exceptions.APIException):
    default_detail = (
        'Midair collision: The object has been modified since the last time it was '
        'fetched, and must be updated on the client.'
    )
    status_code = status.HTTP_409_CONFLICT

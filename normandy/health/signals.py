from django.dispatch import receiver

from dockerflow.django.signals import heartbeat_passed, heartbeat_failed
from statsd.defaults.django import statsd


@receiver(heartbeat_passed)
def heartbeat_passed_handler(sender, level, **kwargs):
    statsd.incr("heartbeat.pass")


@receiver(heartbeat_failed)
def heartbeat_failed_handler(sender, level, **kwargs):
    statsd.incr("heartbeat.fail")

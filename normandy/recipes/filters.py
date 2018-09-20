"""
Filter objects are based on a series of simple rules. In order for a recipe to
match a user, every part of a filter object must be true. In other words, the
parts of a filter expression are ``AND`` ed together.

Each filter below defines a rule, and when it matches a user. Filter parameters
are represented as JSON. Most users will interact with filters at a higher
level, such as a web interface that allows building a filter with a form.

Filter objects are generally specified as a JSON object with at least a
"type" field, and other fields determined by that type. For example,
ChannelFilter` below has a type of "channel" and requires a ``channels``
field, so the final JSON would look something like this:

.. code:: json

    {
        "type": "channel",
        "channels": ["release"]
    }
"""

from rest_framework import serializers


# If you add a new filter to this file, remember to update the docs too!


class BaseFilter(serializers.Serializer):
    type = serializers.CharField(required=False)

    @property
    def type(self):
        raise NotImplementedError()

    def to_jexl(self):
        """Render this filter to a JEXL expression"""
        raise NotImplemented()


class ChannelFilter(BaseFilter):
    """
    Match a user on any of the listed channels.

    .. attribute:: type

        ``channel``

    .. attribute:: channels

       :example: ``["release", "beta"]``
    """

    type = "channel"
    channels = serializers.ListField(child=serializers.CharField(), min_length=1)

    def to_jexl(self):
        channels = ",".join(f'"{c}"' for c in self.data["channels"])
        return f"normandy.channel in [{channels}]"


class LocaleFilter(BaseFilter):
    """
    Match a user on any of the listed locales.

    .. attribute:: type

        ``locale``

    .. attribute:: locales

       Use full ``xx-YY`` locale codes instead of short ``xx`` codes.

       :example: ``["en-US", "en-CA"]``
    """

    type = "locale"
    locales = serializers.ListField(child=serializers.CharField(), min_length=1)

    def to_jexl(self):
        locales = ",".join(f'"{l}"' for l in self.data["locales"])
        return f"normandy.locale in [{locales}]"


class CountryFilter(BaseFilter):
    """Match a user located in any of the listed countries.

    .. attribute:: type

        ``country``

    .. attribute:: countries

       Use two letter country codes.

       :example: ``["US", "DE"]``
    """

    type = "country"
    countries = serializers.ListField(child=serializers.CharField(), min_length=1)

    def to_jexl(self):
        countries = ",".join(f'"{c}"' for c in self.data["countries"])
        return f"normandy.country in [{countries}]"


class BucketSampleFilter(BaseFilter):
    """
    Sample a portion of the users by defining a series of buckets, evenly
    distributing users into those buckets, and then selecting a range of
    those buckets. This is stable: a given set of inputs will always match or
    always not match.

    The range to check is defined by a start point and length, and can wrap
    around the input space. For example, if there are 100 buckets, and we ask
    to check 50 buckets starting from bucket 70, then buckets 70-99 and 0-19
    will be checked.

    This works by hashing the inputs, and comparing the resulting hash to the
    possible hash space.

    .. attribute:: type

        ``bucketSample``

    .. attribute:: input

       A list of :ref:`filter-context` values to consider for the sample.

       :example: ``["normandy.userId", "recipe.id"]``

    .. attribute:: start

       The bucket to begin at.

       :example: ``70``

    .. attribute:: count

       The number of buckets to include. The size of the included population
       will be ``count / total``.

       :example: ``50``

    .. attribute:: total

       The total number of buckets considered in the space.

       :example: ``100``
    """

    type = "bucketSample"
    start = serializers.FloatField()
    count = serializers.FloatField(min_value=0)
    total = serializers.FloatField(min_value=0)
    input = serializers.ListField(child=serializers.CharField(), min_length=1)

    def to_jexl(self):
        inputs = ",".join(f"{i}" for i in self.data["input"])
        start = self.data["start"]
        count = self.data["count"]
        total = self.data["total"]
        return f"[{inputs}]|bucketSample({start},{count},{total})"


class StableSampleFilter(BaseFilter):
    """
    Stably sample users at a particular rate. This is "random" in that it is
    unpredictable, but it will always match or not match for a given Firefox
    profile.

    This works by hashing the inputs, and then checking if the hash falls above
    or below the sample point of the hash space.

    .. attribute:: type

        ``stableSample``

    .. attribute:: input

       A list of :ref:`filter-context` values to consider for the sample.

       :example: ``["normandy.userId", "recipe.id"]``

    .. attribute:: rate

       The portion of the sample that should match.

       :example: ``0.5``
    """

    type = "stableSample"
    rate = serializers.FloatField(min_value=0, max_value=1)
    input = serializers.ListField(child=serializers.CharField(), min_length=1)

    def to_jexl(self):
        inputs = ",".join(f"{i}" for i in self.data["input"])
        rate = self.data["rate"]
        return f"[{inputs}]|stableSample({rate})"


class VersionFilter(BaseFilter):
    """
    Match a user running any of the listed versions. This will include dot
    releases, and won't consider channel.

    .. attribute:: type

        ``version``

    .. attribute:: versions

       :example: ``[59, 61, 62]``
    """

    type = "version"
    # Versions of Firefox before 40 definitely don't support Normandy, so don't allow them
    versions = serializers.ListField(child=serializers.IntegerField(min_value=40), min_length=1)
    """Version's doc string"""

    def to_jexl(self):
        # This could be improved to generate more compact JEXL by noticing
        # adjacent versions, and combining them into a single range. i.e. if
        # `versions` is [55, 56, 57], this could generate
        #
        #   (normandy.version >= 55 && normandy.version < 58)
        #
        # instead of the current, more verbose
        #
        #   (normandy.version >= 55 && normandy.version < 56) ||
        #   (normandy.version >= 56 && normandy.version < 57) ||
        #   (normandy.version >= 57 && normandy.version < 58)

        return "||".join(
            f'(normandy.version>="{v}"&&normandy.version<"{v + 1}")' for v in self.data["versions"]
        )


by_type = {
    f.type: f
    for f in [
        ChannelFilter,
        LocaleFilter,
        CountryFilter,
        BucketSampleFilter,
        StableSampleFilter,
        VersionFilter,
    ]
}


def from_data(data):
    cls = by_type.get(data["type"])
    if cls:
        return cls(data=data)
    else:
        raise ValueError(f'Unknown type "{data["type"]}.')

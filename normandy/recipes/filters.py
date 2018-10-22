"""
Filter objects are based on a series of simple rules. In order for a recipe to
match a user, every part of a filter object must be true. In other words, the
parts of a filter expression are ``AND`` ed together.

Each filter below defines a rule, and when it matches a user. Filter parameters
are represented as JSON. Most users will interact with filters at a higher
level, such as a web interface that allows building a filter with a form.

Filter objects are generally specified as a JSON object with at least a
"type" field, and other fields determined by that type. For example,
``ChannelFilter`` below has a type of "channel" and requires a ``channels``
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

    def validate_channels(self, value):
        # Avoid circular imports
        from normandy.recipes.models import Channel

        for slug in value:
            if not Channel.objects.filter(slug=slug).exists():
                raise serializers.ValidationError(f"Unrecognized channel slug {slug!r}")
        return value

    def to_jexl(self):
        channels = ",".join(f'"{c}"' for c in self.initial_data["channels"])
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

    def validate_locales(self, value):
        # Avoid circular imports
        from normandy.recipes.models import Locale

        for code in value:
            if not Locale.objects.filter(code=code).exists():
                raise serializers.ValidationError(f"Unrecognized locale code {code!r}")
        return value

    def to_jexl(self):
        locales = ",".join(f'"{l}"' for l in self.initial_data["locales"])
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

    def validate_countries(self, value):
        # Avoid circular imports
        from normandy.recipes.models import Country

        for code in value:
            if not Country.objects.filter(code=code).exists():
                raise serializers.ValidationError(f"Unrecognized country code {code!r}")
        return value

    def to_jexl(self):
        countries = ",".join(f'"{c}"' for c in self.initial_data["countries"])
        return f"normandy.country in [{countries}]"


class BucketSampleFilter(BaseFilter):
    """
    Sample a portion of the users by defining a series of buckets, evenly
    distributing users into those buckets, and then selecting a range of
    those buckets.

    This is consistent but unpredictable: a given set of inputs will always
    produce the same answer, but can't be figured out ahead of time. This
    makes it appropriate for sampling since it uniformly distributes inputs
    over the entire sample space, and any variations in the inputs are spread
    out over the entire space.

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
        inputs = ",".join(f"{i}" for i in self.initial_data["input"])
        start = self.initial_data["start"]
        count = self.initial_data["count"]
        total = self.initial_data["total"]
        return f"[{inputs}]|bucketSample({start},{count},{total})"


class StableSampleFilter(BaseFilter):
    """
    Sample a portion of users. With a rate of ``0.3``, 3 out of every 10
    users will be selected by this filter.

    This is consistent but unpredictable: a given set of inputs will always
    produce the same answer, but can't be figured out ahead of time. This
    makes it appropriate for sampling since it uniformly distributes inputs
    over the entire sample space, and any variations in the inputs are spread
    out over the entire space.

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
        inputs = ",".join(f"{i}" for i in self.initial_data["input"])
        rate = self.initial_data["rate"]
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
            f'(normandy.version>="{v}"&&normandy.version<"{v + 1}")'
            for v in self.initial_data["versions"]
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

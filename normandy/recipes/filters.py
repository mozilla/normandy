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
from datetime import datetime
import json


# If you add a new filter to this file, remember to update the docs too!
class BaseFilter(serializers.Serializer):
    @classmethod
    def create(cls, **kwargs):
        data = {"type": cls.type}
        data.update(kwargs)
        obj = cls(data=data)
        assert obj.is_valid(), obj.errors
        return obj

    @property
    def type(self):
        raise NotImplementedError()

    @property
    def capabilities(self):
        """The capabilities needed by this filter"""
        raise NotImplementedError

    def to_jexl(self):
        """Render this filter to a JEXL expression"""
        raise NotImplementedError


class BaseComparisonFilter(BaseFilter):
    value = serializers.IntegerField()
    comparison = serializers.CharField()

    @property
    def left_of_operator(self):
        raise NotImplementedError("Not correctly implemented.")

    def to_jexl(self):
        comparison = self.initial_data["comparison"]
        value = self.initial_data["value"]

        if comparison == "equal":
            operator = "=="
        elif comparison == "not_equal":
            operator = "!="
        elif comparison == "greater_than":
            operator = ">"
        elif comparison == "greater_than_equal":
            operator = ">="
        elif comparison == "less_than":
            operator = "<"
        elif comparison == "less_than_equal":
            operator = "<="
        else:
            raise serializers.ValidationError(f"Unrecognized comparison {comparison!r}")

        return f"{self.left_of_operator} {operator} {value}"


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

    @property
    def capabilities(self):
        # no special capabilities needed
        return set()


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

    @property
    def capabilities(self):
        # no special capabilities needed
        return set()


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

    @property
    def capabilities(self):
        # no special capabilities needed
        return set()


class PlatformFilter(BaseFilter):
    """Match a user based on what operating system they are using.

    .. attribute:: type

        ``platform``

    .. attribute:: platforms

        List of platforms to filter against. The choices are `all_linux`,
        `all_windows`, and `all_mac`.

        :example: ``["all_windows", "all_linux"]``
    """

    type = "platform"
    platforms = serializers.ListField(child=serializers.CharField(), min_length=1)

    def to_jexl(self):
        platforms_jexl = []
        for platform in self.initial_data["platforms"]:
            if platform == "all_mac":
                platforms_jexl.append("normandy.os.isMac")
            elif platform == "all_windows":
                platforms_jexl.append("normandy.os.isWindows")
            elif platform == "all_linux":
                platforms_jexl.append("normandy.os.isLinux")
            else:
                raise serializers.ValidationError(f"Unrecognized platform {platform!r}")

        return "||".join((p for p in platforms_jexl))

    @property
    def capabilities(self):
        return set()


class PrefCompareFilter(BaseFilter):
    """Match based on a user's pref having a particular value.

    .. attribute:: type

        ``pref``

    .. attribute:: value

        string, boolean, or number.

        :example: ``true`` or ``"default"`` or "10"

    .. attribute:: comparison

        Options are ``equal``, ``not_equal``, ``greater_than``,
        ``less_than``, ``greater_than_equal`` and ``less_than_equal``.
    """

    type = "pref"
    pref = serializers.CharField()
    value = serializers.JSONField()
    comparison = serializers.CharField()

    def to_jexl(self):
        comparison = self.initial_data["comparison"]
        value = self.initial_data["value"]
        pref = self.initial_data["pref"]

        if comparison == "contains":
            return f"{json.dumps(value)} in '{pref}'|preferenceValue"
        if comparison == "equal":
            symbol = "=="
        elif comparison == "not_equal":
            symbol = "!="
        elif comparison == "greater_than":
            symbol = ">"
        elif comparison == "greater_than_equal":
            symbol = ">="
        elif comparison == "less_than":
            symbol = "<"
        elif comparison == "less_than_equal":
            symbol = "<="
        else:
            raise serializers.ValidationError(f"Unrecognized comparison {comparison!r}")

        return f"'{pref}'|preferenceValue {symbol} {json.dumps(value)}"

    @property
    def capabilities(self):
        return {"jexl.transform.preferenceValue"}


class PrefExistsFilter(BaseFilter):
    """Match a user based on if pref exists.

    .. attribute:: type

        ``pref``

    .. attribute:: value

        Boolean true or false.

        :example: ``true`` or ``false``
    """

    type = "pref"
    pref = serializers.CharField()
    value = serializers.BooleanField()

    def to_jexl(self):
        value = self.initial_data["value"]
        pref = self.initial_data["pref"]

        if value:
            return f"'{pref}'|preferenceExists"
        else:
            return f"!('{pref}'|preferenceExists)"

    @property
    def capabilities(self):
        return {"jexl.transform.preferenceExists"}


class PrefUserSetFilter(BaseFilter):
    """Match a user based on if the user set a preference.

    .. attribute:: type

        ``pref``

    .. attribute:: value

        Boolean true or false.

        :example: ``true`` or ``false``
    """

    type = "pref"
    pref = serializers.CharField()
    value = serializers.BooleanField()

    def to_jexl(self):
        value = self.initial_data["value"]
        pref = self.initial_data["pref"]
        if value:
            return f"'{pref}'|preferenceIsUserSet"
        else:
            return f"!('{pref}'|preferenceIsUserSet)"

    @property
    def capabilities(self):
        return {"jexl.transform.preferenceIsUserSet"}


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

    @property
    def capabilities(self):
        return {"jexl.transform.bucketSample"}


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

    @property
    def capabilities(self):
        return {"jexl.transform.stableSample"}


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

    @property
    def capabilities(self):
        # no special capabilities needed
        return set()


class VersionRangeFilter(BaseFilter):
    """
    Match a user running a version in the given range. Uses a version compare
    filter instead of simple string comparison like VersionFilter.

    The version range is half-open, like Python ranges: If min is 72 and max
    is 75, 72.0 will be include, 75.0 will not be. `min <= version < max`.

    ..attribute:: type

        ``version_range``

    .. attribute:: min_version

        :example: ``72.0b5``

    .. attribute:: max_version

        :example: ``75.0.1``
    """

    type = "version_range"
    min_version = serializers.CharField()
    max_version = serializers.CharField()

    def to_jexl(self):
        min_version = self.initial_data["min_version"]
        max_version = self.initial_data["max_version"]

        return "&&".join(
            [
                f'(env.version|versionCompare("{min_version}")>=0)',  # browser version >= min_version
                f'(env.version|versionCompare("{max_version}")<0)',  # browser version < max_version
            ]
        )

    @property
    def capabilities(self):
        return {"jexl.context.env.version", "jexl.transform.versionCompare"}


class DateRangeFilter(BaseFilter):
    """
    Match a user to a delivery that starts on or after the ``not_before`` date and
    before the ``not_after`` date.

    The date range is half-open, so `not_before <= normandy.request_time < not_after`.

    .. attribute:: type

        ``date_range``

    .. attribute:: not_before

       :example: ``2020-02-01T00:00:00Z``

   .. attribute:: not_after

      :example: ``2020-03-01T00:00:00Z``
    """

    type = "date_range"
    not_before = serializers.DateTimeField()
    not_after = serializers.DateTimeField()

    def to_jexl(self):
        not_before = self.initial_data["not_before"]
        not_after = self.initial_data["not_after"]

        return "&&".join(
            [
                f'(normandy.request_time>="{not_before}"|date)',
                f'(normandy.request_time<"{not_after}"|date)',
            ]
        )

    @property
    def capabilities(self):
        return {"jexl.transform.date"}


class WindowsBuildNumberFilter(BaseComparisonFilter):
    type = "windows_build_number"

    @property
    def left_of_operator(self):
        return "normandy.os.windowsBuildNumber"

    @property
    def capabilities(self):
        return set()

    def to_jexl(self):
        return f"(normandy.os.isWindows && {super().to_jexl()})"


class WindowsVersionFilter(BaseComparisonFilter):
    """
    Match a user based on what windows version they are running. This filter
    creates jexl that compares the windows NT version.

    .. attribute:: type

        ``windows_version``

    .. attribute:: value
        string, must be one of the following: 6.1, 6.2, 6.3, 10.0

       :example: ``6.1``

   .. attribute:: comparison
      Options are ``equal``, ``not_equal``, ``greater_than``,
      ``less_than``, ``greater_than_equal`` and ``less_than_equal``.

      :example: ``not_equal``
    """

    type = "windows_version"
    value = serializers.CharField()

    @property
    def left_of_operator(self):
        return "normandy.os.windowsVersion"

    def to_jexl(self):
        return f"(normandy.os.isWindows && {super().to_jexl()})"

    def validate_value(self, value):
        from normandy.recipes.models import WindowsVersion

        if not WindowsVersion.objects.filter(slug=value).exists():
            raise serializers.ValidationError(f"Unrecognized windows version slug {value!r}")

        return value

    @property
    def capabilities(self):
        return set()


class ProfileCreateDateFilter(BaseFilter):
    """
    This filter is meant to distinguish between new and existing users.
    Target users who have a profile creation date older than or newer than
    a given date.

    .. attribute:: type

        ``profile_creation_date``

    .. attribute:: direction

       :example: ``newer_than``

   .. attribute:: date

      :example: ``2020-02-01``
    """

    type = "profile_creation_date"
    direction = serializers.CharField()
    date = serializers.DateField()

    def to_jexl(self):
        direction = self.initial_data["direction"]
        date = self.initial_data["date"]

        days = (datetime.strptime(date, "%Y-%M-%d") - datetime(1970, 1, 1)).days

        if direction == "olderThan":
            symbol = "<="
        elif direction == "newerThan":
            symbol = ">"
        else:
            raise serializers.ValidationError(f"Unrecognized direction {direction!r}")

        return "||".join(
            [
                "(!normandy.telemetry.main)",
                f"(normandy.telemetry.main.environment.profile.creationDate{symbol}{days})",
            ]
        )

    @property
    def capabilities(self):
        return set()


by_type = {
    f.type: f
    for f in [
        ChannelFilter,
        LocaleFilter,
        CountryFilter,
        BucketSampleFilter,
        StableSampleFilter,
        VersionFilter,
        VersionRangeFilter,
        DateRangeFilter,
        ProfileCreateDateFilter,
        PlatformFilter,
        PrefExistsFilter,
        PrefCompareFilter,
        PrefUserSetFilter,
    ]
}


def from_data(data):
    cls = by_type.get(data["type"])
    if cls:
        return cls(data=data)
    else:
        raise ValueError(f'Unknown type "{data["type"]}.')

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

import json
from datetime import datetime

from rest_framework import serializers

from normandy.base.jexl import get_normandy_jexl


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


class BaseAddonFilter(BaseFilter):
    addons = serializers.ListField(child=serializers.CharField(), min_length=1)
    any_or_all = serializers.CharField()

    def get_formatted_string(self, addon):
        raise NotImplementedError("Not correctly implemented.")

    def to_jexl(self):
        any_or_all = self.initial_data["any_or_all"]

        symbol = {"all": "&&", "any": "||"}.get(any_or_all)

        if not symbol:
            raise serializers.ValidationError(
                f"Unrecognized string for any_or_all: {any_or_all!r}"
            )

        return symbol.join(
            self.get_formatted_string(addon) for addon in self.initial_data["addons"]
        )


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


class AddonActiveFilter(BaseAddonFilter):
    """Match a user based on if a particular addon is active.

    .. attribute:: type

        ``addonActive``

    .. attribute:: addons
        List of addon ids to filter against.

        :example: ``["uBlock0@raymondhill.net", "pioneer-opt-in@mozilla.org"]``

    .. attribute:: any_or_all
        This will determine whether the addons are connected with an "&&" operator,
        meaning all the addons must be active for the filter to evaluate to true,
        or an "||" operator, meaning any of the addons can be active to evaluate to
        true.

        :example: ``any`` or ``all``
    """

    type = "addonActive"

    def get_formatted_string(self, addon):
        return f'normandy.addons["{addon}"].isActive'

    @property
    def capabilities(self):
        return set()


class AddonInstalledFilter(BaseAddonFilter):
    """Match a user based on if a particular addon is installed.

    .. attribute:: type

        ``addonInstalled``

    .. attribute:: addons
        List of addon ids to filter against.

        :example: ``["uBlock0@raymondhill.net", "pioneer-opt-in@mozilla.org"]``

    .. attribute:: any_or_all
        This will determine whether the addons are connected with an "&&" operator,
        meaning all the addons must be installed for the filter to evaluate to true,
        or an "||" operator, meaning any of the addons can be installed to
        evaluate to true.

        :example: ``any`` or ``all``
    """

    type = "addonInstalled"

    def get_formatted_string(self, addon):
        return f'normandy.addons["{addon}"]'

    @property
    def capabilities(self):
        return set()


class PrefCompareFilter(BaseFilter):
    """Match based on a user's pref having a particular value.

    .. attribute:: type

        ``preferenceValue``

    .. attribute:: value

        string, boolean, or number.

        :example: ``true`` or ``"default"`` or "10"

    .. attribute:: comparison

        Options are ``equal``, ``not_equal``, ``greater_than``,
        ``less_than``, ``greater_than_equal`` and ``less_than_equal``.
    """

    type = "preferenceValue"
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

        ``preferenceExists``

    .. attribute:: value

        Boolean true or false.

        :example: ``true`` or ``false``
    """

    type = "preferenceExists"
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

        ``preferenceIsUserSet``

    .. attribute:: pref

        The preference to check

        :example: ``app.normandy.enabled``

    .. attribute:: value

        Boolean true or false.

        :example: ``true`` or ``false``
    """

    type = "preferenceIsUserSet"
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


class NamespaceSampleFilter(BaseFilter):
    """
    Like ``BucketSampleFilter``, with two major differences:

        - The number of buckets is locked at 10,000
        - Instead of taking arbitrary inputs, only a namespace is accepted,
          as a string, and the user's client ID is added automatically.

    .. attribute:: type

        ``namespaceSample``

    .. attribute:: namespace

       The namespace to use for the sample, as a simple unquoted string.

       :example: ``global-v2``

    .. attribute:: start

       The bucket to begin at.

       :example: ``70``

    .. attribute:: count

       The number of buckets to include. The size of the included population
       will be ``count / 10,000``. For example, a count of 50 would be 0.5%
       of the population.

       :example: ``50``
    """

    type = "namespaceSample"
    start = serializers.FloatField()
    count = serializers.FloatField(min_value=0)
    namespace = serializers.CharField(min_length=1)

    def to_jexl(self):
        namespace = self.initial_data["namespace"]
        start = self.initial_data["start"]
        count = self.initial_data["count"]
        total = 10_000
        return f'["{namespace}",normandy.userId]|bucketSample({start},{count},{total})'

    @property
    def capabilities(self):
        return {"jexl.transform.bucketSample"}


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

        ``versionRange``

    .. attribute:: min_version

        :example: ``72.0b5``

    .. attribute:: max_version

        :example: ``75.0.1``
    """

    type = "versionRange"
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

        ``dateRange``

    .. attribute:: not_before

       :example: ``2020-02-01T00:00:00Z``

   .. attribute:: not_after

      :example: ``2020-03-01T00:00:00Z``
    """

    type = "dateRange"
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
    """
    Match a user based on what windows version, as represented by build
    number, they are running.

    .. attribute:: type

        ``windowsBuildNumber``

    .. attribute:: value
        integer

       :example: ``15063``

   .. attribute:: comparison
      Options are ``equal``, ``not_equal``, ``greater_than``,
      ``less_than``, ``greater_than_equal`` and ``less_than_equal``.

      :example: ``not_equal``
    """

    type = "windowsBuildNumber"

    @property
    def left_of_operator(self):
        return "normandy.os.windowsBuildNumber"

    @property
    def capabilities(self):
        return set()

    def to_jexl(self):
        return f"(normandy.os.isWindows && {super().to_jexl()})"


class WindowsVersionFilter(BaseFilter):
    """
    Under Development. Match a user based on what windows version they are running. This filter
    creates jexl that compares the windows NT version.

    .. attribute:: type

        ``windowsVersion``

    .. attribute:: versions_list
        list of versions as decimal numbers. Versions will be validated against
        DB table of supported NT versions.

        :options: ``6.1``, ``6.2``, ``6.3``, ``10.0``

        :example: ``[6.1, 6.2]``

    """

    type = "windowsVersion"
    versions_list = serializers.ListField(
        child=serializers.DecimalField(max_digits=3, decimal_places=1), min_length=1
    )

    def to_jexl(self):
        return f"(normandy.os.isWindows && normandy.os.windowsVersion in {self.initial_data['versions_list']})"

    def validate_versions_list(self, versions_list):
        from normandy.recipes.models import WindowsVersion

        all_versions = WindowsVersion.objects.values_list("nt_version", flat=True)
        for version in versions_list:
            if version not in all_versions:
                raise serializers.ValidationError(f"Unrecognized windows version slug {version!r}")
        return versions_list

    @property
    def capabilities(self):
        return set()


class NegateFilter(BaseFilter):
    """
    This filter negates another filter.


    .. attribute:: type

        ``negate``

    .. attribute:: filter_to_negate

        The filter you want to negate.

       :example: `{ "type": "channel", "channels": ["release", "beta"]}`
    """

    type = "negate"
    filter_to_negate = serializers.JSONField()

    def to_jexl(self):
        filter = from_data(self.initial_data["filter_to_negate"])
        return f"!({filter.to_jexl()})"

    @property
    def capabilities(self):
        return set()


class _CompositeFilter(BaseFilter):
    """Internal building block to combine many filters using a single operator"""

    def _get_operator(self):
        raise NotImplementedError()

    def _get_subfilters(self):
        raise NotImplementedError()

    def to_jexl(self):
        parts = [f.to_jexl() for f in self._get_subfilters()]
        expr = self._get_operator().join(parts)
        return f"({expr})"

    @property
    def capabilities(self):
        return set.union(*(subfilter.capabilities for subfilter in self._get_subfilters()))


class AndFilter(_CompositeFilter):
    """
    This filter combines one or more other filters, requiring all subfilters to match.

    .. attribute:: type

        ``and``

    .. attribute:: subfilters

        The filters to combine

        :example: `[{"type": "locale", "locales": "en-US"}, {"type": "country", "countries": "US"}]`
    """

    type = "and"
    subfilters = serializers.ListField(child=serializers.JSONField(), min_length=1)

    def _get_operator(self):
        return "&&"

    def _get_subfilters(self):
        return [from_data(filter) for filter in self.initial_data["subfilters"]]


class OrFilter(_CompositeFilter):
    """
    This filter combines one or more other filters, requiring at least one subfilter to match.

    .. attribute:: type

        ``or``

    .. attribute:: subfilters

        The filters to combine

        :example: `[{"type": "locale", "locales": "en-US"}, {"type": "country", "countries": "US"}]`
    """

    type = "or"
    subfilters = serializers.ListField(child=serializers.JSONField(), min_length=1)

    def _get_operator(self):
        return "||"

    def _get_subfilters(self):
        return [from_data(filter) for filter in self.initial_data["subfilters"]]


class ProfileCreateDateFilter(BaseFilter):
    """
    This filter is meant to distinguish between new and existing users.
    Target users who have a profile creation date older than or newer than
    a given date.

    .. attribute:: type

        ``profileCreationDate``

    .. attribute:: direction

       :Options: ``newerThan`` or ``olderThan``

   .. attribute:: date

      :example: ``2020-02-01``
    """

    type = "profileCreationDate"
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


class JexlFilter(BaseFilter):
    """
    This filter allows the user to specify raw JEXL that will then be
    included as a normal filter object.

    It will combine with other filter objects like an other filter object,
    that is it will be treated as a boolean expression and ANDed with it's
    peers. The JEXL will by checked for syntactical validity. The expression
    will be surrounded with parenthesis.

    This filter should only be used when no other filter object can be used.

    .. attribute:: type

       ``jexl``

    .. attribute:: expression
       The expression to evaluate.

       :example: ``2 + 2 >= 4``

    .. attribute:: capabilities
       An array of the capabilities required by the expression. May be empty
       if the expression does not require any capabilities.

       :example: ``["capabilities-v1"]``

    .. attribute:: comment
       A note about what this expression does. This field is not used
       anywhere, but is present in the API to make it clearer what this
       filter does.

       :example: Only users that saw about:welcome.
    """

    type = "jexl"
    expression = serializers.CharField()
    capabilities = serializers.ListField(child=serializers.CharField(min_length=1), min_length=0)
    comment = serializers.CharField(min_length=1)

    def to_jexl(self):
        built_expression = "(" + self.initial_data["expression"] + ")"
        jexl = get_normandy_jexl()

        errors = list(jexl.validate(built_expression))
        if errors:
            raise serializers.ValidationError(errors)

        return built_expression

    @property
    def capabilities(self):
        return set(self.initial_data["capabilities"])


class PresetFilter(_CompositeFilter):
    """
    A named preset of filters.

    .. attribute:: type

       ``preset``

    .. attribute:: expression

       The name of the preset to evaluate.

       .. autoattribute:: preset_choices

    """

    type = "preset"
    name = serializers.CharField()

    preset_choices = ["pocket-1"]
    """Presets available to use with this filter."""

    def _get_operator(self):
        return "&&"

    def _get_subfilters(self):
        preset_name = self.initial_data["name"]
        if preset_name not in self.preset_choices:
            raise serializers.ValidationError([f"Unknown preset type {preset_name}"])

        preset_name_identifier = preset_name.replace("-", "_")
        generator_name = f"_get_subfilters_{preset_name_identifier}"
        subfilter_data = getattr(self, generator_name)()

        return [from_data(d) for d in subfilter_data]

    def _get_subfilters_pocket_1(self):
        def not_user_set(pref):
            return {"type": "preferenceIsUserSet", "pref": pref, "value": False}

        return [
            {
                "type": "or",
                "subfilters": [
                    not_user_set("browser.newtabpage.enabled"),
                    not_user_set("browser.startup.homepage"),
                ],
            },
            not_user_set("browser.newtabpage.activity-stream.showSearch"),
            not_user_set("browser.newtabpage.activity-stream.feeds.topsites"),
            not_user_set("browser.newtabpage.activity-stream.feeds.section.topstories"),
            not_user_set("browser.newtabpage.activity-stream.feeds.section.highlights"),
        ]


def _calculate_by_type():
    """
    Gather all filters and build a map of types to filters.

    This is done by iterating over all the subclasses, both direct and
    indirect, of `BaseFilter` and checking their types. Only filters who have
    their type defined as a static string are used. Duplicate types will
    cause an error.
    """
    todo = set([BaseFilter])
    all_filter_classes = set()

    while todo:
        parent = todo.pop()
        subclasses = parent.__subclasses__()
        todo = todo.union(subclasses)
        all_filter_classes = all_filter_classes.union(subclasses)

    by_type = {}

    for filter_class in all_filter_classes:
        filter_type = None
        if isinstance(filter_class.type, str):
            filter_type = filter_class.type
        elif isinstance(filter_class.type, property):
            # This is (currently) one of the two base classes. It's safe to ignore
            continue
        else:
            raise Exception(
                f"Unexpected type for type attribute of filter class. "
                f"Class: {filter_class!r} Type Attribute: {type(filter_class.type)}"
            )

        if filter_type in by_type.keys():
            raise Exception(
                f"Duplicate filter type {filter_type!r}, shared by at least "
                f"{by_type[filter_type].__name__} and {filter_class.__name__}."
            )

        by_type[filter_type] = filter_class

    return by_type


by_type = _calculate_by_type()


def from_data(data):
    cls = by_type.get(data["type"])
    if cls:
        return cls(data=data)
    else:
        raise ValueError(f'Unknown type "{data["type"]}.')

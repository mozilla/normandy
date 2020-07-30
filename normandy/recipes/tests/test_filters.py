from datetime import datetime

import factory.fuzzy
import pytest
import re
from collections import defaultdict
from rest_framework import serializers

from normandy.base.jexl import get_normandy_jexl
from normandy.recipes import filters
from normandy.recipes.tests import (
    ChannelFactory,
    LocaleFactory,
    CountryFactory,
    WindowsVersionFactory,
)


@pytest.mark.django_db
class FilterTestsBase:
    """Common tests for all filter object types"""

    should_be_baseline = True

    def create_basic_filter(self):
        """To be overwritten by subclasses to create test filters"""
        raise NotImplementedError

    def test_it_can_be_constructed(self):
        self.create_basic_filter()

    def test_has_capabilities(self):
        filter = self.create_basic_filter()
        # Would throw if not defined
        assert isinstance(filter.capabilities, set)

    def test_jexl_works(self):
        filter = self.create_basic_filter()
        # Would throw if not defined
        expr = filter.to_jexl()
        assert isinstance(expr, str)
        jexl = get_normandy_jexl()
        errors = jexl.validate(expr)
        assert list(errors) == []

    def test_uses_only_baseline_capabilities(self, settings):
        filter = self.create_basic_filter()
        capabilities = filter.capabilities
        if self.should_be_baseline:
            assert capabilities <= settings.BASELINE_CAPABILITIES
        else:
            assert capabilities - settings.BASELINE_CAPABILITIES

    def test_it_is_in_the_by_type_list(self):
        filter_instance = self.create_basic_filter()
        filter_class = filter_instance.__class__
        assert filter_class in filters.by_type.values()

    def test_its_type_is_camelcase(self):
        filter_instance = self.create_basic_filter()
        assert re.match("[a-zA-Z]+", filter_instance.type)
        assert "_" not in filter_instance.type


class TestProfileCreationDateFilter(FilterTestsBase):
    def create_basic_filter(self, direction="olderThan", date="2020-02-01"):
        return filters.ProfileCreateDateFilter.create(direction=direction, date=date)

    def test_generates_jexl_older_than(self):
        filter = self.create_basic_filter(date="2020-07-30")
        assert set(filter.to_jexl().split("||")) == {
            "(!normandy.telemetry.main)",
            "(normandy.telemetry.main.environment.profile.creationDate<=18473)",
        }

    def test_generates_jexl_newer_than(self):
        filter = self.create_basic_filter(direction="newerThan", date="2020-02-01")
        assert set(filter.to_jexl().split("||")) == {
            "(!normandy.telemetry.main)",
            "(normandy.telemetry.main.environment.profile.creationDate>18293)",
        }

    def test_issue_2242(self):
        """Make sure that dates are parsed correctly"""
        epoch = datetime.utcfromtimestamp(0)
        datetime_factory = factory.fuzzy.FuzzyNaiveDateTime(epoch)
        dt = datetime_factory.fuzz()
        # Profile Creation Date is measured in days since epoch.
        daystamp = (dt - epoch).days

        filter = self.create_basic_filter(date=f"{dt.year}-{dt.month}-{dt.day}")
        assert str(daystamp) in filter.to_jexl()

    def test_throws_error_on_bad_direction(self):
        filter = self.create_basic_filter(direction="newer", date="2020-02-01")
        with pytest.raises(serializers.ValidationError):
            filter.to_jexl()

    def test_throws_error_on_bad_date(self):
        with pytest.raises(AssertionError):
            self.create_basic_filter(direction="newerThan", date="Jan 7, 2020")


class TestVersionFilter(FilterTestsBase):
    def create_basic_filter(self, versions=None):
        if versions is None:
            versions = [72, 74]
        return filters.VersionFilter.create(versions=versions)

    def test_generates_jexl(self):
        filter = self.create_basic_filter(versions=[72, 74])
        assert set(filter.to_jexl().split("||")) == {
            '(normandy.version>="72"&&normandy.version<"73")',
            '(normandy.version>="74"&&normandy.version<"75")',
        }


class TestVersionRangeFilter(FilterTestsBase):
    should_be_baseline = False

    def create_basic_filter(self, min_version="72.0b2", max_version="72.0b8"):
        return filters.VersionRangeFilter.create(min_version=min_version, max_version=max_version)

    def test_generates_jexl(self):
        filter = self.create_basic_filter(min_version="72.0b2", max_version="75.0a1")
        assert set(filter.to_jexl().split("&&")) == {
            '(env.version|versionCompare("72.0b2")>=0)',
            '(env.version|versionCompare("75.0a1")<0)',
        }


class TestDateRangeFilter(FilterTestsBase):
    def create_basic_filter(
        self, not_before="2020-02-01T00:00:00Z", not_after="2020-03-01T00:00:00Z"
    ):
        return filters.DateRangeFilter.create(not_before=not_before, not_after=not_after)

    def test_generates_jexl(self):
        filter = self.create_basic_filter()
        assert set(filter.to_jexl().split("&&")) == {
            '(normandy.request_time>="2020-02-01T00:00:00Z"|date)',
            '(normandy.request_time<"2020-03-01T00:00:00Z"|date)',
        }


class TestWindowsBuildNumberFilter(FilterTestsBase):
    def create_basic_filter(self, value=12345, comparison="equal"):
        return filters.WindowsBuildNumberFilter.create(value=value, comparison=comparison)

    @pytest.mark.parametrize(
        "comparison,symbol",
        [
            ("equal", "=="),
            ("greater_than", ">"),
            ("greater_than_equal", ">="),
            ("less_than", "<"),
            ("less_than_equal", "<="),
        ],
    )
    def test_generates_jexl_number_ops(self, comparison, symbol):
        filter = self.create_basic_filter(comparison=comparison)
        assert (
            filter.to_jexl()
            == f"(normandy.os.isWindows && normandy.os.windowsBuildNumber {symbol} 12345)"
        )

    def test_generates_jexl_error_on_bad_comparison(self):
        filter = self.create_basic_filter(comparison="typo")
        with pytest.raises(serializers.ValidationError):
            filter.to_jexl()


class TestWindowsVersionFilter(FilterTestsBase):
    def create_basic_filter(self, versions_list=[6.1]):
        WindowsVersionFactory(nt_version=6.1)
        return filters.WindowsVersionFilter.create(versions_list=versions_list)

    def test_generates_jexl(self):
        filter = self.create_basic_filter()
        assert (
            filter.to_jexl() == f"(normandy.os.isWindows && normandy.os.windowsVersion in [6.1])"
        )

    def test_generates_jexl_error_on_bad_version(self):
        with pytest.raises(AssertionError):
            filters.WindowsVersionFilter.create(versions_list=[8.9])


class TestChannelFilter(FilterTestsBase):
    def create_basic_filter(self, channels=None):
        if channels:
            channel_objs = [ChannelFactory(slug=slug) for slug in channels]
        else:
            channel_objs = [ChannelFactory()]
        return filters.ChannelFilter.create(channels=[c.slug for c in channel_objs])

    def test_generates_jexl(self):
        filter = self.create_basic_filter(channels=["release", "beta"])
        assert filter.to_jexl() == 'normandy.channel in ["release","beta"]'


class TestLocaleFilter(FilterTestsBase):
    def create_basic_filter(self, locales=None):
        if locales:
            locale_objs = [LocaleFactory(code=code) for code in locales]
        else:
            locale_objs = [LocaleFactory()]
        return filters.LocaleFilter.create(locales=[l.code for l in locale_objs])

    def test_generates_jexl(self):
        filter = self.create_basic_filter(locales=["en-US", "en-CA"])
        assert filter.to_jexl() == 'normandy.locale in ["en-US","en-CA"]'


class TestCountryFilter(FilterTestsBase):
    def create_basic_filter(self, countries=None):
        if countries:
            country_objs = [CountryFactory(code=code) for code in countries]
        else:
            country_objs = [CountryFactory()]
        return filters.CountryFilter.create(countries=[c.code for c in country_objs])

    def test_generates_jexl(self):
        filter = self.create_basic_filter(countries=["SV", "MX"])
        assert filter.to_jexl() == 'normandy.country in ["SV","MX"]'


class TestPlatformFilter(FilterTestsBase):
    def create_basic_filter(self, platforms=["all_mac", "all_windows"]):
        return filters.PlatformFilter.create(platforms=platforms)

    def test_generates_jexl_list_of_two(self):
        filter = self.create_basic_filter()
        assert set(filter.to_jexl().split("||")) == {"normandy.os.isMac", "normandy.os.isWindows"}

    def test_generates_jexl_list_of_one(self):
        filter = self.create_basic_filter(platforms=["all_linux"])
        assert set(filter.to_jexl().split("||")) == {"normandy.os.isLinux"}

    def test_throws_error_on_bad_platform(self):
        filter = self.create_basic_filter(platforms=["all_linu"])
        with pytest.raises(serializers.ValidationError):
            filter.to_jexl()


class TestNegateFilter(FilterTestsBase):
    def create_basic_filter(self):
        data_for_filter = {"type": "channel", "channels": ["release", "beta"]}
        return filters.NegateFilter.create(filter_to_negate=data_for_filter)

    def test_generates_jexl(self):
        negate_filter = self.create_basic_filter()
        assert negate_filter.to_jexl() == '!(normandy.channel in ["release","beta"])'


class TestAndFilter(FilterTestsBase):
    def create_basic_filter(self, subfilters=None):
        if subfilters is None:
            subfilters = [
                {"type": "channel", "channels": ["release", "beta"]},
                {"type": "locale", "locales": ["en-US", "de"]},
            ]
        return filters.AndFilter.create(subfilters=subfilters)

    def test_generates_jexl_zero_subfilters(self):
        with pytest.raises(AssertionError) as excinfo:
            self.create_basic_filter(subfilters=[])
        assert "has at least 1 element" in str(excinfo.value)

    def test_generates_jexl_one_subfilter(self):
        negate_filter = self.create_basic_filter(
            subfilters=[{"type": "channel", "channels": ["release"]}]
        )
        assert negate_filter.to_jexl() == '(normandy.channel in ["release"])'

    def test_generates_jexl_two_subfilters(self):
        negate_filter = self.create_basic_filter(
            subfilters=[
                {"type": "channel", "channels": ["release"]},
                {"type": "locale", "locales": ["en-US"]},
            ]
        )
        assert (
            negate_filter.to_jexl()
            == '(normandy.channel in ["release"]&&normandy.locale in ["en-US"])'
        )


class TestOrFilter(FilterTestsBase):
    def create_basic_filter(self, subfilters=None):
        if subfilters is None:
            subfilters = [
                {"type": "channel", "channels": ["release", "beta"]},
                {"type": "locale", "locales": ["en-US", "de"]},
            ]
        return filters.OrFilter.create(subfilters=subfilters)

    def test_generates_jexl_zero_subfilters(self):
        with pytest.raises(AssertionError) as excinfo:
            self.create_basic_filter(subfilters=[])
        assert "has at least 1 element" in str(excinfo.value)

    def test_generates_jexl_one_subfilter(self):
        negate_filter = self.create_basic_filter(
            subfilters=[{"type": "channel", "channels": ["release"]}]
        )
        assert negate_filter.to_jexl() == '(normandy.channel in ["release"])'

    def test_generates_jexl_two_subfilters(self):
        negate_filter = self.create_basic_filter(
            subfilters=[
                {"type": "channel", "channels": ["release"]},
                {"type": "locale", "locales": ["en-US"]},
            ]
        )
        assert (
            negate_filter.to_jexl()
            == '(normandy.channel in ["release"]||normandy.locale in ["en-US"])'
        )


class TestAddonInstalledFilter(FilterTestsBase):
    def create_basic_filter(self, addons=["@abcdef", "ghijk@lmnop"], any_or_all="any"):
        return filters.AddonInstalledFilter.create(addons=addons, any_or_all=any_or_all)

    def test_generates_jexl_installed_any(self):
        filter = self.create_basic_filter()
        assert set(filter.to_jexl().split("||")) == {
            'normandy.addons["@abcdef"]',
            'normandy.addons["ghijk@lmnop"]',
        }

    def test_generates_jexl_installed_all(self):
        filter = self.create_basic_filter(any_or_all="all")
        assert set(filter.to_jexl().split("&&")) == {
            'normandy.addons["@abcdef"]',
            'normandy.addons["ghijk@lmnop"]',
        }

    def test_throws_error_on_bad_any_or_all(self):
        filter = self.create_basic_filter(any_or_all="error")
        with pytest.raises(serializers.ValidationError):
            filter.to_jexl()


class TestAddonActiveFilter(FilterTestsBase):
    def create_basic_filter(self, addons=["@abcdef", "ghijk@lmnop"], any_or_all="any"):
        return filters.AddonActiveFilter.create(addons=addons, any_or_all=any_or_all)

    def test_generates_jexl_active_any(self):
        filter = self.create_basic_filter()
        assert set(filter.to_jexl().split("||")) == {
            'normandy.addons["@abcdef"].isActive',
            'normandy.addons["ghijk@lmnop"].isActive',
        }

    def test_generates_jexl_active_all(self):
        filter = self.create_basic_filter(any_or_all="all")
        assert set(filter.to_jexl().split("&&")) == {
            'normandy.addons["@abcdef"].isActive',
            'normandy.addons["ghijk@lmnop"].isActive',
        }

    def test_throws_error_on_bad_any_or_all(self):
        filter = self.create_basic_filter(any_or_all="error")
        with pytest.raises(serializers.ValidationError):
            filter.to_jexl()


class TestPrefCompareFilter(FilterTestsBase):
    def create_basic_filter(
        self, pref="browser.urlbar.maxRichResults", value=10, comparison="equal"
    ):
        return filters.PrefCompareFilter.create(pref=pref, value=value, comparison=comparison)

    def test_generates_jexl(self):
        filter = self.create_basic_filter()
        assert filter.to_jexl() == "'browser.urlbar.maxRichResults'|preferenceValue == 10"

    @pytest.mark.parametrize(
        "comparison,symbol",
        [
            ("greater_than", ">"),
            ("greater_than_equal", ">="),
            ("less_than", "<"),
            ("less_than_equal", "<="),
        ],
    )
    def test_generates_jexl_number_ops(self, comparison, symbol):
        filter = self.create_basic_filter(comparison=comparison)
        assert filter.to_jexl() == f"'browser.urlbar.maxRichResults'|preferenceValue {symbol} 10"

    def test_generates_jexl_boolean(self):
        filter = self.create_basic_filter(value=False)
        assert filter.to_jexl() == "'browser.urlbar.maxRichResults'|preferenceValue == false"

    def test_generates_jexl_string_in(self):
        filter = self.create_basic_filter(value="default", comparison="contains")
        assert filter.to_jexl() == "\"default\" in 'browser.urlbar.maxRichResults'|preferenceValue"

    def test_generates_jexl_error(self):
        filter = self.create_basic_filter(comparison="invalid")
        with pytest.raises(serializers.ValidationError):
            filter.to_jexl()


class TestPrefExistsFilter(FilterTestsBase):
    def create_basic_filter(self, pref="browser.urlbar.maxRichResults", value=True):
        return filters.PrefExistsFilter.create(pref=pref, value=value)

    def test_generates_jexl_pref_exists_true(self):
        filter = self.create_basic_filter()
        assert filter.to_jexl() == "'browser.urlbar.maxRichResults'|preferenceExists"

    def test_generates_jexl_pref_exists_false(self):
        filter = self.create_basic_filter(value=False)
        assert filter.to_jexl() == "!('browser.urlbar.maxRichResults'|preferenceExists)"


class TestPrefUserSetFilter(FilterTestsBase):
    def create_basic_filter(self, pref="browser.urlbar.maxRichResults", value=True):
        return filters.PrefUserSetFilter.create(pref=pref, value=value)

    def test_generates_jexl_is_user_set_true(self):
        filter = self.create_basic_filter()
        assert filter.to_jexl() == "'browser.urlbar.maxRichResults'|preferenceIsUserSet"

    def test_generates_jexl_is_user_set_false(self):
        filter = self.create_basic_filter(value=False)
        assert filter.to_jexl() == "!('browser.urlbar.maxRichResults'|preferenceIsUserSet)"


class TestBucketSampleFilter(FilterTestsBase):
    def create_basic_filter(self, input=None, start=123, count=10, total=1_000):
        if input is None:
            input = ["normandy.clientId"]
        return filters.BucketSampleFilter.create(
            input=input, start=start, count=count, total=total
        )

    def test_generates_jexl(self):
        filter = self.create_basic_filter(input=["A"], start=10, count=20, total=1_000)
        assert filter.to_jexl() == "[A]|bucketSample(10,20,1000)"

    def test_supports_floats(self):
        filter = self.create_basic_filter(input=["A"], start=10, count=0.5, total=1_000)
        assert filter.to_jexl() == "[A]|bucketSample(10,0.5,1000)"


class TestStableSampleFilter(FilterTestsBase):
    def create_basic_filter(self, input=None, rate=0.01):
        if input is None:
            input = ["normandy.clientId"]
        return filters.StableSampleFilter.create(input=input, rate=rate)

    def test_generates_jexl(self):
        filter = self.create_basic_filter(input=["A"], rate=0.1)
        assert filter.to_jexl() == "[A]|stableSample(0.1)"


class TestNamespaceSampleFilter(FilterTestsBase):
    def create_basic_filter(self, namespace="global-v42", start=123, count=10):
        return filters.NamespaceSampleFilter.create(namespace=namespace, start=start, count=count)

    def test_generates_jexl(self):
        filter = self.create_basic_filter(namespace="fancy-rollout", start=10, count=20)
        assert filter.to_jexl() == '["fancy-rollout",normandy.userId]|bucketSample(10,20,10000)'

    def test_supports_floats(self):
        filter = self.create_basic_filter(namespace="risky-experiment", start=123, count=0.5)
        assert (
            filter.to_jexl() == '["risky-experiment",normandy.userId]|bucketSample(123,0.5,10000)'
        )


class TestJexlFilter(FilterTestsBase):
    should_be_baseline = False

    def create_basic_filter(self, expression="true", capabilities=None, comment="a comment"):
        if capabilities is None:
            capabilities = ["capabilities-v1"]
        return filters.JexlFilter.create(
            expression=expression, capabilities=capabilities, comment=comment
        )

    def test_generates_jexl(self):
        filter = self.create_basic_filter(expression="2 + 2")
        assert filter.to_jexl() == "(2 + 2)"

    def test_it_rejects_invalid_jexl(self):
        filter = self.create_basic_filter(expression="this is an invalid expression")
        with pytest.raises(serializers.ValidationError):
            filter.to_jexl()

    def test_it_has_capabilities(self):
        filter = self.create_basic_filter(capabilities=["a.b", "c.d"])
        assert filter.capabilities == {"a.b", "c.d"}


class TestPresetFilter(FilterTestsBase):
    def create_basic_filter(self, name="pocket-1"):
        return filters.PresetFilter.create(name=name)

    def test_all_choices_have_generators(self):
        f = filters.PresetFilter()
        choices = f.preset_choices
        for choice in choices:
            identifier = choice.replace("-", "_")
            generator_name = f"_get_subfilters_{identifier}"
            getattr(f, generator_name)()

    def test_pocket_1(self):
        filter_object = self.create_basic_filter(name="pocket-1")
        # The preset is an and filter
        assert filter_object._get_operator() == "&&"

        # Pull out the first level subfilters
        subfilters = defaultdict(lambda: [])
        for filter in filter_object._get_subfilters():
            subfilters[type(filter)].append(filter)

        # There should be one or filter
        or_filters = subfilters.pop(filters.OrFilter)
        assert len(or_filters) == 1
        or_subfilters = or_filters[0]._get_subfilters()
        # It should be made up of negative PrefUserSet filters
        for f in or_subfilters:
            assert isinstance(f, filters.PrefUserSetFilter)
            assert f.initial_data["value"] is False
        # And it should use the exected prefs
        assert set(f.initial_data["pref"] for f in or_subfilters) == set(
            ["browser.newtabpage.enabled", "browser.startup.homepage"]
        )

        # There should be a bunch more negative PrefUserSet filters at the top level
        pref_subfilters = subfilters.pop(filters.PrefUserSetFilter)
        for f in pref_subfilters:
            assert f.initial_data["value"] is False
        # and they should be the expected prefs
        assert set(f.initial_data["pref"] for f in pref_subfilters) == set(
            [
                "browser.newtabpage.activity-stream.showSearch",
                "browser.newtabpage.activity-stream.feeds.topsites",
                "browser.newtabpage.activity-stream.feeds.section.topstories",
                "browser.newtabpage.activity-stream.feeds.section.highlights",
            ]
        )

        # There should be no other filters
        assert subfilters == {}, "no unexpected filters"

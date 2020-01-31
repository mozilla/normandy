import pytest

from normandy.recipes.filters import (
    BucketSampleFilter,
    ChannelFilter,
    CountryFilter,
    LocaleFilter,
    StableSampleFilter,
    VersionFilter,
    VersionRangeFilter,
    DateRangeFilter,
)
from normandy.recipes.tests import ChannelFactory, LocaleFactory, CountryFactory


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
        assert isinstance(filter.to_jexl(), str)

    def test_uses_only_baseline_capabilities(self, settings):
        filter = self.create_basic_filter()
        capabilities = filter.capabilities
        if self.should_be_baseline:
            assert capabilities <= settings.BASELINE_CAPABILITIES
        else:
            assert capabilities - settings.BASELINE_CAPABILITIES


class TestVersionFilter(FilterTestsBase):
    def create_basic_filter(self, versions=None):
        if versions is None:
            versions = [72, 74]
        return VersionFilter.create(versions=versions)

    def test_generates_jexl(self):
        filter = self.create_basic_filter(versions=[72, 74])
        assert set(filter.to_jexl().split("||")) == {
            '(normandy.version>="72"&&normandy.version<"73")',
            '(normandy.version>="74"&&normandy.version<"75")',
        }


class TestVersionRangeFilter(FilterTestsBase):
    should_be_baseline = False

    def create_basic_filter(self, min_version="72.0b2", max_version="72.0b8"):
        return VersionRangeFilter.create(min_version=min_version, max_version=max_version)

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
        return DateRangeFilter.create(not_before=not_before, not_after=not_after)

    def test_generates_jexl(self):
        filter = self.create_basic_filter()
        assert set(filter.to_jexl().split("&&")) == {
            '(normandy.request_time>="2020-02-01T00:00:00Z"|date)',
            '(normandy.request_time<="2020-03-01T00:00:00Z"|date)',
        }


class TestChannelFilter(FilterTestsBase):
    def create_basic_filter(self, channels=None):
        if channels:
            channel_objs = [ChannelFactory(slug=slug) for slug in channels]
        else:
            channel_objs = [ChannelFactory()]
        return ChannelFilter.create(channels=[c.slug for c in channel_objs])

    def test_generates_jexl(self):
        filter = self.create_basic_filter(channels=["release", "beta"])
        assert filter.to_jexl() == 'normandy.channel in ["release","beta"]'


class TestLocaleFilter(FilterTestsBase):
    def create_basic_filter(self, locales=None):
        if locales:
            locale_objs = [LocaleFactory(code=code) for code in locales]
        else:
            locale_objs = [LocaleFactory()]
        return LocaleFilter.create(locales=[l.code for l in locale_objs])

    def test_generates_jexl(self):
        filter = self.create_basic_filter(locales=["en-US", "en-CA"])
        assert filter.to_jexl() == 'normandy.locale in ["en-US","en-CA"]'


class TestCountryFilter(FilterTestsBase):
    def create_basic_filter(self, countries=None):
        if countries:
            country_objs = [CountryFactory(code=code) for code in countries]
        else:
            country_objs = [CountryFactory()]
        return CountryFilter.create(countries=[c.code for c in country_objs])

    def test_generates_jexl(self):
        filter = self.create_basic_filter(countries=["SV", "MX"])
        assert filter.to_jexl() == 'normandy.country in ["SV","MX"]'


class TestBucketSamplefilter(FilterTestsBase):
    def create_basic_filter(self, input=None, start=123, count=10, total=1_000):
        if input is None:
            input = ["normandy.clientId"]
        return BucketSampleFilter.create(input=input, start=start, count=count, total=total)

    def test_generates_jexl(self):
        filter = self.create_basic_filter(input=["A"], start=10, count=20, total=1_000)
        assert filter.to_jexl() == "[A]|bucketSample(10,20,1000)"


class TestStableSamplefilter(FilterTestsBase):
    def create_basic_filter(self, input=None, rate=0.01):
        if input is None:
            input = ["normandy.clientId"]
        return StableSampleFilter.create(input=input, rate=rate)

    def test_generates_jexl(self):
        filter = self.create_basic_filter(input=["A"], rate=0.1)
        assert filter.to_jexl() == "[A]|stableSample(0.1)"

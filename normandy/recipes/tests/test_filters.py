import pytest

from normandy.recipes.filters import (
    ChannelFilter,
    LocaleFilter,
    CountryFilter,
    BucketSampleFilter,
    StableSampleFilter,
)
from normandy.recipes.tests import ChannelFactory, LocaleFactory, CountryFactory


@pytest.mark.django_db
class FilterTestsBase:
    """Common tests for all filter object types"""

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

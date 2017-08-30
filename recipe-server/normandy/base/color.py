"""This module implements the Color class for Shield identicons."""


class Color:
    """ Color class
    This class includes various helper functions that deal with manipulating colors
    for the Shield identicons.
    """

    def __init__(self, rgb_tuple):
        self.rgb_tuple = rgb_tuple

    def get_rgb_color(self):
        """Returns the RGB tuple, ex. (255, 255, 255)."""
        return self.rgb_tuple

    def get_css_color(self):
        """Returns the color as a CSS string, ex. rgb(255, 255, 255)."""
        # NOTE: tuples include parentheses when converted to strings
        return f'rgb{self.rgb_tuple}'

    def get_luminance(self):
        """Determine color luminance based on perceived values."""
        return ((0.2126 * self.rgb_tuple[0]) +
                (0.7152 * self.rgb_tuple[1]) +
                (0.0722 * self.rgb_tuple[2]))

    def contrasts_well(self, pair_color):
        """Determine whether self and pair_color contrast well."""
        base_luminance = self.get_luminance()
        return abs(base_luminance - pair_color.get_luminance()) > 75

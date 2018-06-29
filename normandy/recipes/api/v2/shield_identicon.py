import random

from django.template.loader import render_to_string


class Color:
    """ Color class
    This class includes various helper functions that deal with manipulating colors
    for the Shield identicons.
    """

    def __init__(self, red, green, blue):
        self.red = red
        self.green = green
        self.blue = blue

    @property
    def rgb_color(self):
        """Returns the RGB tuple, ex. (255, 255, 255)."""
        return (self.red, self.green, self.blue)

    @property
    def css_color(self):
        """Returns the color as a CSS string, ex. rgb(255, 255, 255)."""
        # NOTE: tuples include parentheses when converted to strings
        return f"rgb{self.red, self.green, self.blue}"

    @property
    def luminance(self):
        """Determine color luminance based on perceived values."""
        return (0.2126 * self.red) + (0.7152 * self.green) + (0.0722 * self.blue)

    def contrasts_well(self, pair_color):
        """Determine whether self and pair_color contrast well."""
        return abs(self.luminance - pair_color.luminance) > 75


class Genome(random.Random):
    """A seedable source that provides arbitrarily sized chunks of randomness."""

    # Colors taken from the Solarized color scheme (http://ethanschoonover.com/solarized)
    colors = [
        Color(0x00, 0x2b, 0x36),
        Color(0x07, 0x36, 0x42),
        Color(0x58, 0x6e, 0x75),
        Color(0x65, 0x7b, 0x83),
        Color(0x83, 0x94, 0x96),
        Color(0x93, 0xa1, 0xa1),
        Color(0xee, 0xe8, 0xd5),
        Color(0xfd, 0xf6, 0xe3),
        Color(0xff, 0xcf, 0x00),  # alternate yellow color
        Color(0xcb, 0x4b, 0x16),
        Color(0xdc, 0x32, 0x2f),
        Color(0xd3, 0x36, 0x82),
        Color(0x6c, 0x71, 0xc4),
        Color(0x26, 0x8b, 0xd2),
        Color(0x2a, 0xa1, 0x98),
        Color(0x85, 0x99, 0x00),
    ]

    emojis = [
        # fmt: off
        "😄", "😃", "😀", "😊", "😉", "😍", "😘", "😚", "😗", "😙", "😜",
        "😝", "😛", "😳", "😁", "😔", "😌", "😒", "😞", "😣", "😢", "😂",
        "😭", "😪", "😥", "😰", "😅", "😓", "😨", "😱", "😠", "😡", "😤",
        "😖", "😆", "😋", "😷", "😎", "😴", "😵", "😲", "😟", "😦", "😧",
        "😈", "👿", "😮", "😬", "😐", "😯", "😶", "😇", "😏", "😑", "👼",
        "😺", "😻", "😽", "😼", "🙀", "😿", "😹", "😾", "👹", "👺", "🙈",
        "🙉", "🙊", "💀", "👽", "💩", "🔥", "✨", "🌟", "💫", "💥", "💦",
        "💧", "💤", "👂", "👀", "👃", "👅", "👄", "👍", "👎", "👌", "👊",
        "✊", "👋", "✋", "👐", "👆", "🙌", "🙏", "👏", "💪", "💃", "🎩",
        "👑", "👒", "👟", "👞", "👡", "👠", "👢", "💼", "👜", "👝", "👛",
        "👓", "🎀", "🌂", "💄", "💛", "💙", "💜", "💚", "💔", "💗", "💓",
        "💕", "💖", "💞", "💘", "💌", "💋", "💍", "💎", "👣", "🐶", "🐺",
        "🐱", "🐭", "🐹", "🐰", "🐸", "🐯", "🐨", "🐻", "🐷", "🐽", "🐮",
        "🐗", "🐵", "🐒", "🐴", "🐑", "🐘", "🐼", "🐧", "🐦", "🐤", "🐥",
        "🐣", "🐔", "🐍", "🐢", "🐛", "🐝", "🐜", "🐞", "🐌", "🐙", "🐚",
        "🐠", "🐟", "🐬", "🐳", "🐋", "🐄", "🐏", "🐀", "🐃", "🐅", "🐇",
        "🐉", "🐎", "🐐", "🐓", "🐕", "🐖", "🐁", "🐂", "🐲", "🐡", "🐊",
        "🐫", "🐪", "🐆", "🐈", "🐩", "🐾", "💐", "🌸", "🌷", "🍀", "🌹",
        "🌻", "🌺", "🍁", "🍃", "🍂", "🌿", "🌾", "🍄", "🌵", "🌴", "🌲",
        "🌳", "🌰", "🌱", "🌼", "🌐", "🌞", "🌝", "🌚", "🌜", "🌛", "🌙",
        "🌍", "🌎", "🌏", "⭐", "⛅", "⛄", "🌀", "💝", "🎒", "🎓", "🎏",
        "🎃", "👻", "🎄", "🎁", "🎋", "🎉", "🎈", "🔮", "🎥", "📷", "📹",
        "📼", "💿", "📀", "💽", "💾", "💻", "📱", "📞", "📟", "📠", "📡",
        "📺", "📻", "🔊", "🔔", "📢", "⏳", "⏰", "🔓", "🔒", "🔏", "🔐",
        "🔑", "🔎", "💡", "🔦", "🔆", "🔅", "🔌", "🔋", "🔍", "🛁", "🚿",
        "🚽", "🔧", "🔨", "🚪", "💣", "🔫", "🔪", "💊", "💉", "💰", "💸",
        "📨", "📬", "📌", "📎", "📕", "📓", "📚", "📖", "🔬", "🔭", "🎨",
        "🎬", "🎤", "🎵", "🎹", "🎻", "🎺", "🎷", "🎸", "👾", "🎮", "🃏",
        "🎲", "🎯", "🏈", "🏀", "⚽", "🎾", "🎱", "🏉", "🎳", "⛳", "🚴",
        "🏁", "🏇", "🏆", "🎿", "🏂", "🏄", "🎣", "🍵", "🍶", "🍼", "🍺",
        "🍻", "🍸", "🍹", "🍷", "🍴", "🍕", "🍔", "🍟", "🍗", "🍤", "🍞",
        "🍩", "🍮", "🍦", "🍨", "🍧", "🎂", "🍰", "🍪", "🍫", "🍬", "🍭",
        "🍯", "🍎", "🍏", "🍊", "🍋", "🍒", "🍇", "🍉", "🍓", "🍑", "🍌",
        "🍐", "🍍", "🍆", "🍅", "🌽", "🏠", "🏡", "⛵", "🚤", "🚣", "🚀",
        "🚁", "🚂", "🚎", "🚌", "🚍", "🚙", "🚘", "🚗", "🚕", "🚖", "🚛",
        "🚚", "🚨", "🚓", "🚔", "🚒", "🚑", "🚐", "🚲", "🚜", "💈", "🚦",
        "🚧", "🏮", "🎰", "🗿", "🎪", "🎭", "📍", "🚩", "💯",
        # fmt: on
    ]

    def weighted_choice(self, options):
        """
        Choose a random object from an array by weight.
        `options` should be dicts with at least a `weight` key.
        """
        sum_weights = sum(o["weight"] for o in options)

        choice = self.randrange(sum_weights)
        for option in options:
            choice -= option["weight"]
            if choice <= 0:
                return option
        raise Exception("No choices chosen.")

    def emoji(self):
        """Generates a random emoji."""
        return self.choice(self.emojis)

    def color(self):
        """Generates a random color."""
        return self.choice(self.colors)

    def pick_pair(self, base_color):
        good_pairs = [color for color in self.colors if base_color.contrasts_well(color)]
        assert len(good_pairs), "no colors satisfy the luminance requirement"
        return self.choice(good_pairs)


def single_color(genome):
    return {"treatment": "SingleColor"}


def two_color(genome):
    context_update = {}
    context_update["treatment"] = "TwoColor"
    angle = genome.choice(range(0, 360, 45))
    context_update["transform"] = f"scale(100) rotate({angle} 0.5,0.5)"
    return context_update


def stripes(genome):
    context_update = {}
    context_update["treatment"] = "Stripes"
    count = genome.randint(1, 4)
    padding = genome.uniform(0.1, 0.4)
    stride = (1 - 2 * padding) / (2 * count + 1)

    context_update["stripe_x_list"] = [padding + stride * (2 * i + 1) for i in range(count)]
    context_update["stride"] = stride
    rotations = [0, 45, 90, 135]
    angle = genome.choice(rotations)
    context_update["transform"] = f"scale(100) rotate({angle} 0.5,0.5)"
    return context_update


def generate_svg(genome):
    treatments = [
        {"function": single_color, "weight": 1},
        {"function": two_color, "weight": 4},
        {"function": stripes, "weight": 6},
    ]
    treatment_context = genome.weighted_choice(treatments)["function"]
    field_color = genome.color()
    pattern_color = genome.pick_pair(field_color)
    context = {
        "emoji": genome.emoji(),
        "field_color": field_color.css_color,
        "pattern_color": pattern_color.css_color,
    }
    context.update(treatment_context(genome))

    return render_to_string("identicon.svg", context)

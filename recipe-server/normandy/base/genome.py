import math
import random
import string

from hashlib import sha256

from normandy.base.color import Color


class Genome:
    """A seedable source that provides arbitrarily sized chunks of randomness."""
    def __init__(self, chromosome, entropy):
        self.chromosome = chromosome
        self.entropy = entropy
        self.log = []
        # Colors taken from the Solarized color scheme (http://ethanschoonover.com/solarized)
        self.colors = [
            Color((0x00, 0x2b, 0x36)),
            Color((0x07, 0x36, 0x42)),
            Color((0x58, 0x6e, 0x75)),
            Color((0x65, 0x7b, 0x83)),
            Color((0x83, 0x94, 0x96)),
            Color((0x93, 0xa1, 0xa1)),
            Color((0xee, 0xe8, 0xd5)),
            Color((0xfd, 0xf6, 0xe3)),
            Color((0xff, 0xcf, 0x00)),  # alternate yellow color
            Color((0xcb, 0x4b, 0x16)),
            Color((0xdc, 0x32, 0x2f)),
            Color((0xd3, 0x36, 0x82)),
            Color((0x6c, 0x71, 0xc4)),
            Color((0x26, 0x8b, 0xd2)),
            Color((0x2a, 0xa1, 0x98)),
            Color((0x85, 0x99, 0x00)),
        ]

    @staticmethod
    def generate(seed=random.random()):
        """
        Asynchronously returns a Genome based on the given seed.
        :param seed:
            Any JSON serializable value. Will be used to seed the genome.
            If not provided, will be randomly generated.
        """
        sha_256 = sha256(str(seed).encode('utf-8'))
        chromosome = int(sha_256.hexdigest(), base=16)
        return Genome(chromosome, 256)

    def take(self, mod):
        """
        Return an integer in the range [0, mod), and deduct the correct
        amount of entropy from the pool. Vulnerable to modulus-bias when
        ``mod`` is not a power of two.
        This is the fundamental way to consume a Genome. All the other
        methods below that use entropy defer to this method.
        """
        needed = math.log2(mod)
        if self.entropy < needed:
            raise Exception('Not enough entropy left in genome.')
        quotient, remainder = divmod(self.chromosome, mod)
        self.entropy -= needed
        self.chromosome = quotient
        return remainder

    def choice(self, options):
        """Choose a random value from an array."""
        idx = self.take(len(options))
        return options[idx]

    def weighted_choice(self, options):
        """
        Choose a random object from an array by weight.
        `options` should be objects with at least a `weight` key.
        """
        sum_weights = sum(o['weight'] for o in options)

        choice = self.take(sum_weights)
        for option in options:
            choice -= option['weight']
            if choice <= 0:
                return option
        raise Exception('No choices chosen.')

    def int(self, min_value, max_value):
        """A random integer between ``min_value`` and ``max_value``."""
        return self.take(max_value - min_value) + min_value

    def float(self, min_value, max_value, *, precision):
        """
        Generates a random integer in [0, precision), and then maps that as a
        float to the range [min_value, max_value).
        """
        initial_rand = self.take(precision) / precision
        return initial_rand * (max_value - min_value) + min_value

    def letter(self):
        """Generates a random capital letter."""
        return string.ascii_letters[self.int(26, 52)]

    def emoji(self):
        """Generates a random emoji."""
        emojis = ["😄", "😃", "😀", "😊", "😉", "😍", "😘", "😚", "😗", "😙", "😜", "😝", "😛",
                  "😳", "😁", "😔", "😌", "😒", "😞", "😣", "😢", "😂", "😭", "😪", "😥", "😰",
                  "😅", "😓", "😨", "😱", "😠", "😡", "😤", "😖", "😆", "😋", "😷", "😎", "😴",
                  "😵", "😲", "😟", "😦", "😧", "😈", "👿", "😮", "😬", "😐", "😯", "😶", "😇",
                  "😏", "😑", "👼", "😺", "😻", "😽", "😼", "🙀", "😿", "😹", "😾", "👹", "👺",
                  "🙈", "🙉", "🙊", "💀", "👽", "💩", "🔥", "✨", "🌟", "💫", "💥", "💦", "💧",
                  "💤", "👂", "👀", "👃", "👅", "👄", "👍", "👎", "👌", "👊", "✊", "👋", "✋",
                  "👐", "👆", "🙌", "🙏", "👏", "💪", "💃", "🎩", "👑", "👒", "👟", "👞", "👡",
                  "👠", "👢", "💼", "👜", "👝", "👛", "👓", "🎀", "🌂", "💄", "💛", "💙", "💜",
                  "💚", "💔", "💗", "💓", "💕", "💖", "💞", "💘", "💌", "💋", "💍", "💎", "👣",
                  "🐶", "🐺", "🐱", "🐭", "🐹", "🐰", "🐸", "🐯", "🐨", "🐻", "🐷", "🐽", "🐮",
                  "🐗", "🐵", "🐒", "🐴", "🐑", "🐘", "🐼", "🐧", "🐦", "🐤", "🐥", "🐣", "🐔",
                  "🐍", "🐢", "🐛", "🐝", "🐜", "🐞", "🐌", "🐙", "🐚", "🐠", "🐟", "🐬", "🐳",
                  "🐋", "🐄", "🐏", "🐀", "🐃", "🐅", "🐇", "🐉", "🐎", "🐐", "🐓", "🐕", "🐖",
                  "🐁", "🐂", "🐲", "🐡", "🐊", "🐫", "🐪", "🐆", "🐈", "🐩", "🐾", "💐", "🌸",
                  "🌷", "🍀", "🌹", "🌻", "🌺", "🍁", "🍃", "🍂", "🌿", "🌾", "🍄", "🌵", "🌴",
                  "🌲", "🌳", "🌰", "🌱", "🌼", "🌐", "🌞", "🌝", "🌚", "🌜", "🌛", "🌙", "🌍",
                  "🌎", "🌏", "⭐", "⛅", "⛄", "🌀", "💝", "🎒", "🎓", "🎏", "🎃", "👻", "🎄",
                  "🎁", "🎋", "🎉", "🎈", "🔮", "🎥", "📷", "📹", "📼", "💿", "📀", "💽", "💾",
                  "💻", "📱", "📞", "📟", "📠", "📡", "📺", "📻", "🔊", "🔔", "📢", "⏳", "⏰",
                  "🔓", "🔒", "🔏", "🔐", "🔑", "🔎", "💡", "🔦", "🔆", "🔅", "🔌", "🔋", "🔍",
                  "🛁", "🚿", "🚽", "🔧", "🔨", "🚪", "💣", "🔫", "🔪", "💊", "💉", "💰", "💸",
                  "📨", "📬", "📌", "📎", "📕", "📓", "📚", "📖", "🔬", "🔭", "🎨", "🎬", "🎤",
                  "🎵", "🎹", "🎻", "🎺", "🎷", "🎸", "👾", "🎮", "🃏", "🎲", "🎯", "🏈", "🏀",
                  "⚽", "🎾", "🎱", "🏉", "🎳", "⛳", "🚴", "🏁", "🏇", "🏆", "🎿", "🏂", "🏄",
                  "🎣", "🍵", "🍶", "🍼", "🍺", "🍻", "🍸", "🍹", "🍷", "🍴", "🍕", "🍔", "🍟",
                  "🍗", "🍤", "🍞", "🍩", "🍮", "🍦", "🍨", "🍧", "🎂", "🍰", "🍪", "🍫", "🍬",
                  "🍭", "🍯", "🍎", "🍏", "🍊", "🍋", "🍒", "🍇", "🍉", "🍓", "🍑", "🍌", "🍐",
                  "🍍", "🍆", "🍅", "🌽", "🏠", "🏡", "⛵", "🚤", "🚣", "🚀", "🚁", "🚂", "🚎",
                  "🚌", "🚍", "🚙", "🚘", "🚗", "🚕", "🚖", "🚛", "🚚", "🚨", "🚓", "🚔", "🚒",
                  "🚑", "🚐", "🚲", "🚜", "💈", "🚦", "🚧", "🏮", "🎰", "🗿", "🎪", "🎭", "📍",
                  "🚩", "💯"]
        return self.choice(emojis)

    def color(self):
        """Generates a random color."""
        return self.choice(self.colors)

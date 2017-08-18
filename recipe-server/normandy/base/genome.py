import math
import random
import string

from hashlib import sha256


class Genome:
    """A seedable source that provides arbitrarily sized chunks of randomness."""
    def __init__(self, chromosome, entropy):
        self.chromosome = chromosome
        self.entropy = entropy
        self.log = []

    @staticmethod
    def generate(seed=random.random()):
        """Asynchronously returns a Genome based on the given seed.
        seed -- Any JSON serializable value. Will be used to seed the
                genome. If not provided, will be randomly generated.
        """
        hash = sha256(str(seed).encode('utf-8'))
        chromosome = int(hash.hexdigest(), base=16)
        return Genome(chromosome, 256)

    def take(self, mod, reason):
        """Return an integer in the range [0, mod), and deduct the correct
        amount of entropy from the pool. Vulnerable to modulus-bias when
        `mod` is not a power of two.
        This is the fundamental way to consume a Genome. All the other
        methods below that use entropy defer to this method.
        """
        needed = math.log2(mod)
        if self.entropy < needed:
            raise Exception('Not enough entropy left in genome.')
        self.entropy -= needed
        quotient, remainder = divmod(self.chromosome, mod)
        self.log.append({
            'reason': reason,
            'mod': mod,
            'remainder': str(remainder),
            'before': self.chromosome,
            'after': quotient,
        })
        self.chromosome = quotient
        return remainder

    def choice(self, options, extra):
        """Choose a random value from an array."""
        idx = self.take(len(options), extra)
        return options[idx]

    def weightedChoice(self, options, reason):
        """Choose a random object from an array by weight.
        `options` should be objects with at least a `weight` key.
        """
        sumWeights = sum(o['weight'] for o in options)

        choice = self.take(sumWeights, reason)
        for option in options:
            choice -= option['weight']
            if choice <= 0:
                return option
        raise Exception('No choices chosen.')

    def int(self, min, max, reason):
        """A random integer between `min` and `max`"""
        return self.take(max - min, reason) + min

    def float(self, min, max, precision, reason):
        """Generates a random integer in [0, precision), and then maps that as a
        float to the range [min, max)."""
        r = self.take(precision, reason) / precision
        return r * (max - min) + min

    def letter(self, reason):
        """Generates a random capital letter."""
        return string.ascii_letters[self.int(26, 52, reason)]

    def emoji(self, reason):
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
        return self.choice(emojis, reason)

    def color(self, reason):
        """Generates a random color."""
        colors = [
            '#002b36',  # base03
            '#073642',  # base02
            '#586e75',  # base01
            '#657b83',  # base00
            '#839496',  # base0
            '#93a1a1',  # base1
            '#eee8d5',  # base2
            '#fdf6e3',  # base3
            # '#b58900',  # yellow
            '#ffcf00',
            '#cb4b16',  # orange
            '#dc322f',  # red
            '#d33682',  # magenta
            '#6c71c4',  # violet
            '#268bd2',  # blue
            '#2aa198',  # cyan
            '#859900',  # green
        ]
        return self.choice(colors, reason)

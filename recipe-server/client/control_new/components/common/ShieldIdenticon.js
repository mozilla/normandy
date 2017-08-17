import React from 'react';
import PropTypes from 'prop-types';

import Genome from 'control_new/utils/Genome';

const emojis = [...`😄😃😀😊😉😍😘😚😗😙😜😝😛😳😁😔😌😒😞😣😢😂😭😪😥😰😅😓😨😱😠😡😤😖😆😋😷😎
  😴😵😲😟😦😧😈👿😮😬😐😯😶😇😏😑👼😺😻😽😼🙀😿😹😾👹👺🙈🙉🙊💀👽💩🔥✨🌟💫💥💦💧💤👂👀👃👅👄👍
  👎👌👊✊👋✋👐👆🙌🙏👏💪💃🎩👑👒👟👞👡👠👢💼👜👝👛👓🎀🌂💄💛💙💜💚💔💗💓💕💖💞💘💌💋💍💎👣🐶🐺
  🐱🐭🐹🐰🐸🐯🐨🐻🐷🐽🐮🐗🐵🐒🐴🐑🐘🐼🐧🐦🐤🐥🐣🐔🐍🐢🐛🐝🐜🐞🐌🐙🐚🐠🐟🐬🐳🐋🐄🐏🐀🐃🐅🐇🐉🐎🐐
  🐓🐕🐖🐁🐂🐲🐡🐊🐫🐪🐆🐈🐩🐾💐🌸🌷🍀🌹🌻🌺🍁🍃🍂🌿🌾🍄🌵🌴🌲🌳🌰🌱🌼🌐🌞🌝🌚🌜🌛🌙🌍🌎🌏⭐⛅⛄
  🌀💝🎒🎓🎏🎃👻🎄🎁🎋🎉🎈🔮🎥📷📹📼💿📀💽💾💻📱📞📟📠📡📺📻🔊🔔📢⏳⏰🔓🔒🔏🔐🔑🔎💡🔦🔆🔅🔌🔋🔍
  🛁🚿🚽🔧🔨🚪💣🔫🔪💊💉💰💸📨📬📌📎📕📓📚📖🔬🔭🎨🎬🎤🎵🎹🎻🎺🎷🎸👾🎮🃏🎲🎯🏈🏀⚽🎾🎱🏉🎳⛳🚴🏁
  🏇🏆🎿🏂🏄🎣🍵🍶🍼🍺🍻🍸🍹🍷🍴🍕🍔🍟🍗🍤🍞🍩🍮🍦🍨🍧🎂🍰🍪🍫🍬🍭🍯🍎🍏🍊🍋🍒🍇🍉🍓🍑🍌🍐🍍🍆🍅
  🌽🏠🏡⛵🚤🚣🚀🚁🚂🚎🚌🚍🚙🚘🚗🚕🚖🚛🚚🚨🚓🚔🚒🚑🚐🚲🚜💈🚦🚧🏮🎰🗿🎪🎭📍🚩💯`]
  .filter(emo => emo.indexOf(/\n/) > -1 || emo.trim());

console.log(emojis);

export const colors = [
  '#002b36', // base03
  '#073642', // base02
  '#586e75', // base01
  '#657b83', // base00
  '#839496', // base0
  '#93a1a1', // base1
  '#eee8d5', // base2
  '#fdf6e3', // base3
  // '#b58900', // yellow
  '#ffcf00',
  '#cb4b16', // orange
  '#dc322f', // red
  '#d33682', // magenta
  '#6c71c4', // violet
  '#268bd2', // blue
  '#2aa198', // cyan
  '#859900', // green
];

const shieldShape = `
  M 0.5 0.0
  C 0.6 0.1, 0.7 0.15, 0.9 0.15
  C 0.9 0.5, 0.9 0.8, 0.5 1.0
  C 0.1 0.8, 0.1 0.5, 0.1 0.15
  C 0.3 0.15, 0.4 0.1, 0.5 0.0
`;

function NullTreatment() { return null; }

@Genome.wrapComponent(genome => ({
  count: genome.int(1, 4, 'stripe count'),
  padding: genome.float(0.1, 0.4, 32, 'stripe padding'),
  direction: genome.choice(Stripes.directions, 'stripe direction'),
}))
class Stripes extends React.PureComponent {
  static directions = ['vertical', 'horizontal', 'diagonal1', 'diagonal2']

  static propTypes = {
    genome: PropTypes.shape({ then: PropTypes.func.isRequired }).isRequired,
    fill: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
    padding: PropTypes.number.isRequired,
    direction: PropTypes.string.isRequired,
  }

  render() {
    const { fill, count, direction, padding } = this.props;
    const stride = (1 - 2 * padding) / (2 * count + 1);

    const stripes = [];
    for (let i = 0; i < count; i++) {
      stripes.push(
        <rect
          x={padding + stride * (2 * i + 1)}
          y={-0.25}
          width={stride}
          height={1.5}
          fill={fill}
          key={`stripe-${i}`}
        />,
      );
    }

    const rotations = { vertical: 0, diagonal1: 45, horizontal: 90, diagonal2: 135 };
    const transform = `scale(100) rotate(${rotations[direction]} 0.5,0.5)`;

    return <g transform={transform}>{stripes}</g>;
  }
}

@Genome.wrapComponent(genome => ({
  area: genome.choice(Cover.areas, 'area'),
}))
class Cover extends React.PureComponent {
  static areas = [
    'top',
    'bottom',
    'left',
    'right',
    'topLeft',
    'topRight',
    'bottomLeft',
    'bottomRight',
  ];

  static propTypes = {
    genome: PropTypes.shape({ then: PropTypes.func.isRequired }).isRequired,
    fill: PropTypes.string.isRequired,
    area: PropTypes.string.isRequired,
  }

  render() {
    const { fill, area } = this.props;

    const rotations = {
      top: 0,
      topRight: 45,
      right: 90,
      bottomRight: 135,
      bottom: 180,
      bottomLeft: 225,
      left: 270,
      topLeft: 315,
    };
    const rotation = rotations[area];
    const transform = `scale(100) rotate(${rotation} 0.5,0.5)`;

    return (
      <g transform={transform}>
        <rect fill={fill} x={-0.25} y={-0.25} width={1.5} height={0.75} />
      </g>
    );
  }
}


function hexLuma(hex) {
  // Quick HEX to RGB.
  const hexRgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  const R = parseInt(hexRgb[1], 16);
  const G = parseInt(hexRgb[2], 16);
  const B = parseInt(hexRgb[3], 16);

  // Determine color luminance based on perceived values.
  return (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
}

function pickPair(genome, base) {
  const baseLuminance = hexLuma(base);
  let chosenColor;
  let pairLuminance;

  do {
    chosenColor = genome.choice(colors, 'counter color');
    pairLuminance = hexLuma(chosenColor);
  } while (Math.abs(baseLuminance - pairLuminance) < 75);

  return chosenColor;
}


/** Renders an identicon Shield */
@Genome.wrapComponent(genome => {
  const treatment = genome.weightedChoice(Shield.treatments, 'treatment').component;
  const emoji = genome.choice(emojis, 'device emoji');

  const fieldColor = genome.choice(colors, 'field color');
  const patternColor = pickPair(genome, fieldColor);

  return { treatment, fieldColor, patternColor, emoji };
})
export class Shield extends React.PureComponent {
  static propTypes = {
    treatment: PropTypes.func.isRequired,
    fieldColor: PropTypes.string.isRequired,
    patternColor: PropTypes.string.isRequired,
    emoji: PropTypes.string.isRequired,
    genome: PropTypes.shape({ then: PropTypes.func.isRequired }).isRequired,
  };

  static treatments = [
    { component: NullTreatment, weight: 1 },
    { component: Stripes, weight: 6 },
    { component: Cover, weight: 4 },
  ];

  render() {
    const {
      treatment: Treatment,
      fieldColor,
      patternColor,
      emoji,
      genome,
    } = this.props;

    return (
      <g>
        <defs>
          <clipPath id="shield-border" transform="scale(100)">
            <path d={shieldShape} />
          </clipPath>
        </defs>

        <g clipPath="url(#shield-border)">
          <rect fill={fieldColor} width="100" height="100" />
          <Treatment genome={genome} fill={patternColor} />
          <text
            fill="#fff"
            fontFamily="serif"
            fontSize={48}
            fontWeight="bold"
            textAnchor="middle"
            x={50}
            y={72}
          >
            {emoji}
          </text>
        </g>
      </g>
    );
  }
}


export default class CachedShield extends React.PureComponent {
  static propTypes = {
    seed: PropTypes.any.isRequired,
    size: PropTypes.number,
  };

  static defaultProps = {
    size: 64,
  };

  static cache = {};

  render() {
    const cacheKey = this.props.seed;

    // The guts of the shield remains the same, so we can cache the result here.
    if (!CachedShield.cache[cacheKey]) {
      CachedShield.cache[cacheKey] = <Shield {...this.props} />;
    }

    return (
      <div className="shield-identicon">
        {/* The `size` prop can change without affecting the cached shield design. */}
        <svg viewBox="0 0 100 100" height={this.props.size} width={this.props.size}>
          {CachedShield.cache[cacheKey]}
        </svg>
      </div>
    );
  }
}

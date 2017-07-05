import React from 'react';
import PropTypes from 'prop-types';

import Genome from 'control_new/utils/Genome';

// Solarized colors
export const colors = [
  '#002b36', // base03
  '#073642', // base02
  '#586e75', // base01
  '#657b83', // base00
  '#839496', // base0
  '#93a1a1', // base1
  '#eee8d5', // base2
  '#fdf6e3', // base3
  '#b58900', // yellow
  '#cb4b16', // orange
  '#dc322f', // red
  '#d33682', // magenta
  '#6c71c4', // violet
  '#268bd2', // blue
  '#2aa198', // cyan
  '#859900', // green
];

// A list of low-contrast color pairs
export const badColors = {
  '#002b36': ['#073642'],
  '#073642': ['#002b36'],
  '#268bd2': ['#657b83'],
  '#586e75': ['#6c71c4'],
  '#657b83': ['#6c71c4', '#268bd2'],
  '#6c71c4': ['#586e75', '#657b83'],
  '#839496': ['#93a1a1', '#859900'],
  '#859900': ['#839496', '#b58900'],
  '#93a1a1': ['#839496'],
  '#b58900': ['#859900'],
  '#cb4b16': ['#dc322f', '#d33682'],
  '#d33682': ['#cb4b16', '#dc322f'],
  '#dc322f': ['#cb4b16', '#d33682'],
  '#eee8d5': ['#fdf6e3'],
  '#fdf6e3': ['#eee8d5'],
};
// colors are always bad with themselves
for (let color of colors) {
  if (!(color in badColors)) {
    badColors[color] = [];
  }
  badColors[color].push(color);
}
console.log(badColors);

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
class Stripes extends React.Component {
  static directions = ['vertical', 'horizontal', 'diagnol1', 'diagnol2']

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
        />
      );
    }

    const rotations = { vertical: 0, diagnol1: 45, horizontal: 90, diagnol2: 135 };
    const transform = `scale(100) rotate(${rotations[direction]} 0.5,0.5)`;

    return <g transform={transform}>{stripes}</g>;
  }
}

@Genome.wrapComponent(genome => ({
  area: genome.choice(Cover.areas, 'area'),
}))
class Cover extends React.Component {
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

/** Renders an identicon Shield */
@Genome.wrapComponent(genome => {
  const treatment = genome.weightedChoice(Shield.treatments, 'treatment').component;
  const letter = genome.letter('device letter');

  let localBadColors = [];
  const fieldColor = genome.choice(colors, 'fieldColor');
  localBadColors = localBadColors.concat(badColors[fieldColor] || []);

  let patternColorChoices = colors.filter(c => localBadColors.indexOf(c) === -1);
  const patternColor = genome.choice(patternColorChoices, 'patternColor');

  localBadColors = localBadColors.concat(badColors[patternColor] || []);
  let deviceColorChoices = colors.filter(c => localBadColors.indexOf(c) === -1);
  const deviceColor = genome.choice(deviceColorChoices, 'deviceColor');

  return { treatment, fieldColor, patternColor, letter, deviceColor };
})
export default class Shield extends React.Component {
  static propTypes = {
    treatment: PropTypes.func.isRequired,
    fieldColor: PropTypes.string.isRequired,
    deviceColor: PropTypes.string.isRequired,
    patternColor: PropTypes.string.isRequired,
    letter: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    genome: PropTypes.shape({ then: PropTypes.func.isRequired }).isRequired,
  }

  static defaultProps = {
    size: 64,
  }

  static treatments = [
    { component: NullTreatment, weight: 1 },
    { component: Stripes, weight: 6 },
    { component: Cover, weight: 4 },
  ]

  render() {
    const {
      treatment: Treatment,
      fieldColor,
      patternColor,
      deviceColor,
      letter,
      size,
      genome,
    } = this.props;

    return (
      <div className='shield-identicon'>
        <svg width={size} height={size} viewBox="0 0 100 100">
          <defs>
            <clipPath id="shield-border" transform="scale(100)">
              <path d={shieldShape} />
            </clipPath>
          </defs>

          <g clipPath="url(#shield-border)">
            <rect fill={fieldColor} width="100" height="100" />
            <Treatment genome={genome} fill={patternColor} />
            <text
              fill={deviceColor}
              fontFamily="serif"
              fontSize={64}
              fontWeight="bold"
              textAnchor="middle"
              x={50}
              y={72}
            >
              {letter && letter[0]}
            </text>
            <path
              d={shieldShape}
              stroke="black"
              fill="none"
              transform="scale(100)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </svg>
      </div>
    );
  }
}

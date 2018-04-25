import { Card, Icon, Tooltip } from 'antd';
import { is, List, Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import CopyToClipboard from 'react-copy-to-clipboard';

import { addSessionView } from 'control/state/app/session/actions';

@connect(() => ({}), { addSessionView })
export default class RecipeDetails extends React.PureComponent {
  static propTypes = {
    addSessionView: PropTypes.func.isRequired,
    recipe: PropTypes.instanceOf(Map).isRequired,
  }

  componentDidMount() {
    const recipeName = this.props.recipe.get('name');
    if (recipeName) {
      this.props.addSessionView('recipe', recipeName, this.props.recipe.get('identicon_seed'));
    }
  }

  componentWillReceiveProps({ recipe }) {
    const oldRecipe = this.props.recipe;

    // New recipe means we add a session view.
    if (!is(oldRecipe, recipe) && oldRecipe.get('name') !== recipe.get('name')) {
      const recipeName = recipe.get('name');
      this.props.addSessionView('recipe', recipeName, recipe.get('identicon_seed'));
    }
  }

  render() {
    const { recipe } = this.props;

    return (
      <div className="recipe-details">
        <Card className="noHovering" key="recipe-details" title="Recipe">
          <dl className="details">
            <dt>Name</dt>
            <ArgumentsValue name="name" value={recipe.get('name')} />

            <dt>Filters</dt>
            <ArgumentsValue
              name="extra_filter_expression"
              value={recipe.get('extra_filter_expression')}
            />
          </dl>
        </Card>

        <Card className="noHovering" key="action-details" title="Action">
          <dl className="details">
            <dt>Name</dt>
            <ArgumentsValue name="name" value={recipe.getIn(['action', 'name'])} />

            {
              recipe.get('arguments', new Map()).map((value, key) => ([
                <dt key={`dt-${key}`}>
                  {key.replace(/([A-Z]+)/g, ' $1')}
                </dt>,
                <ArgumentsValue key={`dd-${key}`} name={key} value={value} />,
              ])).toArray()
            }
          </dl>
        </Card>
      </div>
    );
  }
}


export class ArgumentsValue extends React.PureComponent {
  static propTypes = {
    name: PropTypes.string,
    value: PropTypes.any.isRequired,
  };

  static defaultProps = {
    name: null,
  };

  static stringifyImmutable(value) {
    return JSON.stringify(value);
  }

  // Determine if an object is an instance of any of the given classes
  compareInstances(obj, types) {
    return types.some(type => obj instanceof type);
  }

  renderBranchTable(branches) {
    const sumRatios = branches.map(branch => branch.get('ratio')).reduce((a, b) => a + b) || 1;

    return (
      <table className="pref-experiment-branches">
        <thead>
          <tr>
            <th>Slug</th>
            <th>Value</th>
            <th className="right">Ratio</th>
          </tr>
        </thead>
        <tbody>
          {branches.map(branch => (
            <tr key={branch.get('slug')}>
              <td>{branch.get('slug')}</td>
              <td><ArgumentsValue name="value" value={branch.get('value')} /></td>
              <td className="right">{Math.round(branch.get('ratio') / sumRatios * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  renderCode(code) {
    return <pre><code>{code}</code></pre>;
  }

  renderBoolean(value) {
    return value ? 'True' : 'False';
  }

  render() {
    const { name, value } = this.props;

    let valueRender = x => x;

    if (name === 'branches') {
      valueRender = this.renderBranchTable;
    } else if (name === 'extra_filter_expression') {
      valueRender = this.renderCode;
    } else if (typeof value === 'boolean') {
      valueRender = this.renderBoolean;
    } else if (typeof value === 'object') {
      valueRender = JSON.stringify;
    }

    let textToCopy = value === undefined ? '' : value.toString();
    if (this.compareInstances(value, [List, Map])) {
      textToCopy = ArgumentsValue.stringifyImmutable(value);
    }

    return (
      <dd className="arguments-value">
        <div className="value">
          {valueRender(value)}
        </div>
        <Tooltip mouseEnterDelay={1} title="Copy to Clipboard" placement="top">
          <CopyToClipboard className="copy-icon" text={textToCopy}>
            <Icon type="copy" />
          </CopyToClipboard>
        </Tooltip>
      </dd>
    );
  }
}

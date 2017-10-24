import { Card } from 'antd';
import { is, Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

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
            <dd>{recipe.get('name')}</dd>

            <dt>Filters</dt>
            <dd>
              <pre><code>{recipe.get('extra_filter_expression')}</code></pre>
            </dd>
          </dl>
        </Card>

        <Card className="noHovering" key="action-details" title="Action">
          <dl className="details">
            <dt>Name</dt>
            <dd>{recipe.getIn(['action', 'name'])}</dd>

            {
              recipe.get('arguments', new Map()).map((value, key) => ([
                <dt key={`dt-${key}`}>
                  {key.replace(/([A-Z]+)/g, ' $1')}
                </dt>,
                <dd key={`dd-${key}`}>
                  <ArgumentsValue name={key} value={value} />
                </dd>,
              ])).toArray()
            }
          </dl>
        </Card>
      </div>
    );
  }
}


class ArgumentsValue extends React.PureComponent {
  static propTypes = {
    name: PropTypes.string,
    value: PropTypes.any.isRequired,
  };

  static defaultProps = {
    name: null,
  };

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

  render() {
    const { name, value } = this.props;

    if (name === 'branches') {
      return this.renderBranchTable(value);
    }

    if (typeof value === 'boolean') {
      return <span>{value ? 'True' : 'False'}</span>;
    }

    return <span>{value && value.toString()}</span>;
  }
}

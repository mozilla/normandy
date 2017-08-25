import { Card } from 'antd';
import { is, Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { addSessionView } from 'control_new/state/app/session/actions';

@connect(() => ({}), { addSessionView })
export default class RecipeDetails extends React.Component {
  static propTypes = {
    addSessionView: PropTypes.func.isRequired,
    recipe: PropTypes.instanceOf(Map).isRequired,
  }

  componentDidMount() {
    const recipeName = this.props.recipe.get('name');
    if (recipeName) {
      this.props.addSessionView(recipeName);
    }
  }

  componentWillReceiveProps({ recipe }) {
    const oldRecipe = this.props.recipe;

    // New recipe means we add a session view.
    if (!is(oldRecipe, recipe) && oldRecipe.get('name') !== recipe.get('name')) {
      const recipeName = recipe.get('name');
      this.props.addSessionView(recipeName);
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
                  {value}
                </dd>,
              ])).toArray()
            }
          </dl>
        </Card>
      </div>
    );
  }
}

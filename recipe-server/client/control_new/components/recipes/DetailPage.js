import React from 'react';
import pt from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'redux-little-router';
import { Row, Col, Spin, Card } from 'antd';

import QueryRecipe from 'control_new/components/data/QueryRecipe';
import { getCurrentRecipe } from 'control_new/state/recipes/selectors';

@connect(
  state => ({
    recipe: getCurrentRecipe(state),
  })
)
export default class DetailPage extends React.Component {
  static propTypes = {
    recipe: pt.object,
  }

  render() {
    const { recipe } = this.props;
    return (
      <div className="page-recipe-detail">
        <QueryRecipe />
        <Row>
          <Col span={16}>
            {recipe ? <Detail recipe={recipe} /> : <Spin />}
          </Col>
          <Col span={8}>
            History goes here
          </Col>
        </Row>
      </div>
    );
  }
}

class Detail extends React.Component {
  static propTypes = {
    recipe: pt.object.isRequired,
  }

  render() {
    const { recipe } = this.props;
    return (
      <div>
        <h2>Recipe</h2>

        <dl className="detail">
          <dt>Name</dt>
          <dd>{recipe.get('name')}</dd>
          <dt>Filters</dt>
          <dd>
            <pre><code>{recipe.get('extra_filter_expression')}</code></pre>
          </dd>
          <dt>Action</dt>
          <dd>{recipe.getIn(['action', 'name'])}</dd>
        </dl>

        <h3>Action Arguments</h3>

        <dl className="detail">
          {recipe.get('arguments').toSeq().map((value, key) => (
             [
               <dt key={`argument-key-${key}`}>{key}</dt>,
               <dd key={`argument-value-${key}`}>{value}</dd>,
             ]
          ))}
        </dl>

        <hr />
        <hr />

        {recipe ? <pre><code>{JSON.stringify(recipe, null, 4)}</code></pre> : "Loading..."}
      </div>
    );
  }
}

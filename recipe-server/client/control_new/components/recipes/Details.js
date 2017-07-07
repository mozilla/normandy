import { Card } from 'antd';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';


export default function Details({ recipe }) {
  return (
    <div>
      <Card key="recipe-details" title="Recipe">
        <dl className="details">
          <dt>Name</dt>
          <dd>{recipe.get('name')}</dd>

          <dt>Filters</dt>
          <dd>
            <pre><code>{recipe.get('extra_filter_expression')}</code></pre>
          </dd>
        </dl>
      </Card>

      <Card key="action-details" title="Action">
        <dl className="details">
          <dt>Name</dt>
          <dd>{recipe.getIn(['action', 'name'])}</dd>

          {
            recipe.get('arguments', new Map()).map((value, key) => ([
              <dt key={`dt-${key}`}>
                {key}
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

Details.propTypes = {
  recipe: PropTypes.object.isRequired,
};

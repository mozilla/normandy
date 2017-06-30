import { Button, Col, Input, Row } from 'antd'
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push as pushAction, Link } from 'redux-little-router';

import CheckboxMenu from 'control_new/components/common/CheckboxMenu';
import * as recipeActions from 'control_new/state/recipes/actions';
import {
  getRecipeListingColumns,
} from 'control_new/state/recipes/selectors';
import {
  getCurrentURL,
  getQueryParameter,
} from 'control_new/state/router/selectors';

@connect(
  state => ({
    columns: getRecipeListingColumns(state),
    getCurrentURL: queryParams => getCurrentURL(state, queryParams),
    searchText: getQueryParameter(state, 'searchText'),
  }),
  dispatch => (
    bindActionCreators({
      push: pushAction,
      saveRecipeListingColumns: recipeActions.saveRecipeListingColumns,
    }, dispatch)
  )
)
@autobind
export default class ListingActionBar extends React.Component {
  static propTypes = {
    columns: PropTypes.object,
    getCurrentURL: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
    saveRecipeListingColumns: PropTypes.func.isRequired,
    searchText: PropTypes.string,
  };

  handleChangeSearch(value) {
    const { getCurrentURL, push } = this.props;
    push(
      getCurrentURL({ searchText: value || undefined })
    );
  }

  render() {
    const { columns, searchText } = this.props;
    return (
      <Row gutter={16} className="list-action-bar">
        <Col span={14}>
          <Input.Search
            className="search"
            placeholder="Search..."
            defaultValue={searchText}
            onSearch={this.handleChangeSearch}
          />
        </Col>
        <Col span={2}>
          <CheckboxMenu
            checkboxes={columns.toJS()}
            label="Columns"
            onChange={this.props.saveRecipeListingColumns}
            options={[
              { label: 'Name', value: 'name' },
              { label: 'Action', value: 'action' },
              { label: 'Enabled', value: 'enabled' },
              { label: 'Last Updated', value: 'lastUpdated' },
            ]}
          />
        </Col>
        <Col span={8} className="righted">
          <Link href="/recipes/new">
            <Button type="primary" icon="plus">New Recipe</Button>
          </Link>
        </Col>
      </Row>
    );
  }
}

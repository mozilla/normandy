import { Button, Col, Input, Row } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { push as pushAction, Link } from 'redux-little-router';

import CheckboxMenu from 'control_new/components/common/CheckboxMenu';
import * as recipeActions from 'control_new/state/recipes/actions';
import {
  getRecipeListingColumns,
} from 'control_new/state/recipes/selectors';
import * as routerSelectors from 'control_new/state/router/selectors';

@connect(
  state => ({
    columns: getRecipeListingColumns(state),
    getCurrentURL: queryParams => routerSelectors.getCurrentURL(state, queryParams),
    searchText: routerSelectors.getQueryParam(state, 'searchText'),
  }),
  {
    push: pushAction,
    saveRecipeListingColumns: recipeActions.saveRecipeListingColumns,
  },
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

  static defaultProps = {
    columns: null,
    searchText: null,
  }

  handleChangeSearch(value) {
    const { getCurrentURL, push } = this.props;
    push(getCurrentURL({ searchText: value || undefined }));
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
          <Link href="/recipe/new">
            <Button type="primary" icon="plus">New Recipe</Button>
          </Link>
        </Col>
      </Row>
    );
  }
}

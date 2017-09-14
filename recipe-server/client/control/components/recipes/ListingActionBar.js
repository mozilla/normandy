import { Button, Col, Input, Row } from 'antd';
import autobind from 'autobind-decorator';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { push as pushAction, Link } from 'redux-little-router';

import CheckboxMenu from 'control/components/common/CheckboxMenu';
import {
  saveRecipeListingColumns as saveRecipeListingColumnsAction,
} from 'control/state/app/recipes/actions';
import {
  getRecipeListingColumns,
} from 'control/state/app/recipes/selectors';
import {
  getCurrentURL as getCurrentURLSelector,
  getQueryParam,
} from 'control/state/router/selectors';


@connect(
  state => ({
    columns: getRecipeListingColumns(state),
    getCurrentURL: queryParams => getCurrentURLSelector(state, queryParams),
    searchText: getQueryParam(state, 'searchText'),
  }),
  {
    push: pushAction,
    saveRecipeListingColumns: saveRecipeListingColumnsAction,
  },
)
@autobind
export default class ListingActionBar extends React.PureComponent {
  static propTypes = {
    columns: PropTypes.instanceOf(List).isRequired,
    getCurrentURL: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
    saveRecipeListingColumns: PropTypes.func.isRequired,
    searchText: PropTypes.string,
  };

  static defaultProps = {
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
          <Link href="/recipe/new/" id="lab-recipe-link">
            <Button type="primary" icon="plus" id="lab-recipe-button">New Recipe</Button>
          </Link>
        </Col>
      </Row>
    );
  }
}

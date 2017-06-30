import { Button, Col, Input, Pagination, Row, Table } from 'antd';
import autobind from 'autobind-decorator';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push as pushAction, Link } from 'redux-little-router';

import BooleanIcon from 'control_new/components/common/BooleanIcon';
import LoadingOverlay from 'control_new/components/common/LoadingOverlay';
import QueryRecipes from 'control_new/components/data/QueryRecipes';
import ListingActionBar from 'control_new/components/recipes/ListingActionBar';
import DataList from 'control_new/components/tables/DataList';
import * as recipeActions from 'control_new/state/recipes/actions';
import {
  getRecipeListingColumns,
  getRecipeListingCount,
  getRecipeListingFlattenedAction,
} from 'control_new/state/recipes/selectors';
import {
  getCurrentURL,
  getQueryParameter,
} from 'control_new/state/router/selectors';


@connect(
  state => ({
    columns: getRecipeListingColumns(state),
    count: getRecipeListingCount(state),
    getCurrentURL: queryParams => getCurrentURL(state, queryParams),
    ordering: getQueryParameter(state, 'ordering', '-last_updated'),
    pageNumber: parseInt(getQueryParameter(state, 'page', 1), 10),
    recipes: getRecipeListingFlattenedAction(state),
    searchText: getQueryParameter(state, 'searchText'),
    status: getQueryParameter(state, 'status'),
  }),
  dispatch => (
    bindActionCreators({
      fetchFilteredRecipesPage: recipeActions.fetchFilteredRecipesPage,
      push: pushAction,
    }, dispatch)
  )
)
@autobind
export default class Listing extends React.Component {
  static propTypes = {
    columns: PropTypes.object,
    count: PropTypes.number,
    fetchFilteredRecipesPage: PropTypes.func.isRequired,
    getCurrentURL: PropTypes.func.isRequired,
    ordering: PropTypes.string,
    pageNumber: PropTypes.number,
    push: PropTypes.func.isRequired,
    recipes: PropTypes.object.isRequired,
    searchText: PropTypes.string,
    status: PropTypes.string,
  };

  static columnRenderers = {
    name({ ordering }) {
      return (
        <Table.Column
          title="Name"
          dataIndex="name"
          key="name"
          render={Listing.renderLinkedText}
          sortOrder={DataList.getSortOrder('name', ordering)}
          sorter
        />
      );
    },

    action() {
      return (
        <Table.Column
          title="Action"
          dataIndex="action"
          key="action"
          render={Listing.renderLinkedText}
        />
      );
    },

    enabled({ status }) {
      return (
        <Table.Column
          title="Enabled"
          key="status"
          render={(text, record) => <BooleanIcon value={record.enabled} />}
          filters={[
            { text: 'Enabled', value: 'enabled' },
            { text: 'Disabled', value: 'disabled' },
          ]}
          filteredValue={status}
          filterMultiple={false}
        />
      );
    },

    lastUpdated({ ordering }) {
      return (
        <Table.Column
          title="Last Updated"
          key="last_updated"
          dataIndex="last_updated"
          render={(text, record) => {
            const lastUpdated = moment(record.last_updated);
            return (
              <Link href={`/recipes/${record.id}`} title={lastUpdated.format('LLLL')}>
                {lastUpdated.fromNow()}
              </Link>
            );
          }}
          sortOrder={DataList.getSortOrder('last_updated', ordering)}
          sorter
        />
      );
    },
  }

  static renderLinkedText(text, record) {
    return <Link href={`/recipes/${record.id}`}>{text}</Link>;
  }

  getFilters() {
    const { ordering, searchText, status } = this.props;

    const filters = {
      text: searchText,
      ordering,
      status,
    };

    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    return filters;
  }

  handleChangePage(page) {
    const { getCurrentURL, push } = this.props;
    push(getCurrentURL({ page }));
  }

  handleRowClick(record) {
    const { push } = this.props;
    push(`recipes/${record.id}`);
  }

  render() {
    const { columns, count, ordering, pageNumber, recipes, status } = this.props;

    return (
      <div>
        <QueryRecipes
          pageNumber={pageNumber}
          filters={this.getFilters()}
        />
        <LoadingOverlay>
          <ListingActionBar />

          <DataList
            columns={columns}
            columnRenderers={Listing.columnRenderers}
            dataSource={recipes.toJS()}
            ordering={ordering}
            onRowClick={this.handleRowClick}
            status={status}
          />

          <Pagination
            current={pageNumber}
            pageSize={10}
            total={count}
            onChange={this.handleChangePage}
          />
        </LoadingOverlay>
      </div>
    );
  }
}

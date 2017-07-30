import { Pagination, Table } from 'antd';
import autobind from 'autobind-decorator';
import { List } from 'immutable';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { push as pushAction, Link } from 'redux-little-router';

import BooleanIcon from 'control_new/components/common/BooleanIcon';
import LoadingOverlay from 'control_new/components/common/LoadingOverlay';
import QueryRecipeListingColumns from 'control_new/components/data/QueryRecipeListingColumns';
import QueryMultipleRecipes from 'control_new/components/data/QueryMultipleRecipes';
import ListingActionBar from 'control_new/components/recipes/ListingActionBar';
import DataList from 'control_new/components/tables/DataList';
import {
  fetchFilteredRecipesPage as fetchFilteredRecipesPageAction,
} from 'control_new/state/app/recipes/actions';
import {
  getRecipeListingColumns,
  getRecipeListingCount,
  getRecipeListingFlattenedAction,
} from 'control_new/state/app/recipes/selectors';
import {
  getCurrentURL as getCurrentURLSelector,
  getQueryParam,
  getQueryParamAsInt,
} from 'control_new/state/router/selectors';


@connect(
  state => ({
    columns: getRecipeListingColumns(state),
    count: getRecipeListingCount(state),
    getCurrentURL: queryParams => getCurrentURLSelector(state, queryParams),
    ordering: getQueryParam(state, 'ordering', '-last_updated'),
    pageNumber: getQueryParamAsInt(state, 'page', 1),
    recipes: getRecipeListingFlattenedAction(state),
    searchText: getQueryParam(state, 'searchText'),
    status: getQueryParam(state, 'status'),
  }),
  {
    fetchFilteredRecipesPage: fetchFilteredRecipesPageAction,
    push: pushAction,
  },
)
@autobind
export default class RecipeListing extends React.Component {
  static propTypes = {
    columns: PropTypes.instanceOf(List).isRequired,
    count: PropTypes.number,
    fetchFilteredRecipesPage: PropTypes.func.isRequired,
    getCurrentURL: PropTypes.func.isRequired,
    ordering: PropTypes.string,
    pageNumber: PropTypes.number,
    push: PropTypes.func.isRequired,
    recipes: PropTypes.instanceOf(List).isRequired,
    searchText: PropTypes.string,
    status: PropTypes.string,
  };

  static defaultProps = {
    count: null,
    ordering: null,
    pageNumber: null,
    searchText: null,
    status: null,
  };

  static columnRenderers = {
    name({ ordering }) {
      return (
        <Table.Column
          title="Name"
          dataIndex="name"
          key="name"
          render={RecipeListing.renderLinkedText}
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
          render={RecipeListing.renderLinkedText}
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
              <Link href={`/recipe/${record.id}`} title={lastUpdated.format('LLLL')}>
                {lastUpdated.fromNow()}
              </Link>
            );
          }}
          sortOrder={DataList.getSortOrder('last_updated', ordering)}
          sorter
        />
      );
    },
  };

  static renderLinkedText(text, record) {
    return <Link href={`/recipe/${record.id}`}>{text}</Link>;
  }

  getFilters() {
    const { ordering, searchText, status } = this.props;

    const filters = {
      text: searchText,
      ordering,
      status,
    };

    Object.keys(filters).forEach(key => {
      if ([undefined, null].includes(filters[key])) {
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
    push(`/recipe/${record.id}`);
  }

  render() {
    const { columns, count, ordering, pageNumber, recipes, status } = this.props;

    return (
      <div>
        <QueryRecipeListingColumns />
        <QueryMultipleRecipes
          pageNumber={pageNumber}
          filters={this.getFilters()}
        />

        <ListingActionBar />

        <LoadingOverlay>
          <DataList
            columns={columns}
            columnRenderers={RecipeListing.columnRenderers}
            dataSource={recipes.toJS()}
            ordering={ordering}
            onRowClick={this.handleRowClick}
            status={status}
          />
        </LoadingOverlay>

        <Pagination
          current={pageNumber}
          pageSize={10}
          total={count}
          onChange={this.handleChangePage}
        />
      </div>
    );
  }
}

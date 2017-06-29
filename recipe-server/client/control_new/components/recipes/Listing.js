import { Button, Col, Input, Pagination, Row, Table } from 'antd';
import autobind from 'autobind-decorator';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push, Link } from 'redux-little-router';

import BooleanIcon from 'control_new/components/common/BooleanIcon';
import LoadingOverlay from 'control_new/components/common/LoadingOverlay';
import QueryRecipes from 'control_new/components/data/QueryRecipes';
import ColumnSelector from 'control_new/components/tables/ColumnSelector';
import DataList from 'control_new/components/tables/DataList';
import {
  fetchFilteredRecipesPage,
  saveRecipeListingColumns,
} from 'control_new/state/recipes/actions';
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
    getCurrentURL: queryParams => getCurrentURL(state, queryParams),
    searchText: getQueryParameter(state, 'searchText'),
  }),
  dispatch => (
    bindActionCreators(
      {
        push,
        saveRecipeListingColumns,
      }, dispatch
    )
  )
)
@autobind
class ActionBar extends React.Component {
  static propTypes = {
    columns: PropTypes.object,
    getCurrentURL: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
    saveRecipeListingColumns: PropTypes.func.isRequired,
    searchText: PropTypes.string,
  };

  handleChangeSearch(value) {
    this.props.push(
      this.props.getCurrentURL({ searchText: value || undefined })
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
          <ColumnSelector
            columns={columns.toJS()}
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


@connect(
  state => ({
    columns: getRecipeListingColumns(state),
    count: getRecipeListingCount(state),
    getCurrentURL: queryParams => getCurrentURL(state, queryParams),
    ordering: getQueryParameter(state, 'ordering', '-last-updated'),
    pageNumber: parseInt(getQueryParameter(state, 'page', 1), 10),
    recipes: getRecipeListingFlattenedAction(state),
    searchText: getQueryParameter(state, 'searchText'),
    status: getQueryParameter(state, 'status'),
  }),
  dispatch => (
    bindActionCreators(
      {
        fetchFilteredRecipesPage,
        push,
      }, dispatch
    )
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
              <span title={lastUpdated.format('LLLL')}>
                {lastUpdated.fromNow()}
              </span>
            );
          }}
          sortOrder={DataList.getSortOrder('last_updated', ordering)}
          sorter
        />
      );
    },
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
    this.props.push(
      this.props.getCurrentURL({ page })
    );
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
          <ActionBar />

          <DataList
            columns={columns}
            columnRenderers={Listing.columnRenderers}
            dataSource={recipes.toJS()}
            ordering={ordering}
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

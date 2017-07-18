import { Pagination, Table } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { push as pushAction, Link } from 'redux-little-router';

import LoadingOverlay from 'control_new/components/common/LoadingOverlay';
import QueryExtensionListingColumns from 'control_new/components/data/QueryExtensionListingColumns';
import QueryMultipleExtensions from 'control_new/components/data/QueryMultipleExtensions';
import ListingActionBar from 'control_new/components/extensions/ListingActionBar';
import DataList from 'control_new/components/tables/DataList';
import {
  getExtensionListingColumns,
  getExtensionListingCount,
  getExtensionListing,
} from 'control_new/state/extensions/selectors';
import * as routerSelectors from 'control_new/state/router/selectors';


@connect(
  state => ({
    columns: getExtensionListingColumns(state),
    count: getExtensionListingCount(state),
    extensions: getExtensionListing(state),
    getCurrentURL: queryParams => routerSelectors.getCurrentURL(state, queryParams),
    ordering: routerSelectors.getQueryParam(state, 'ordering', '-last_updated'),
    pageNumber: routerSelectors.getQueryParamAsInt(state, 'page', 1),
  }),
  {
    push: pushAction,
  },
)
@autobind
export default class Listing extends React.Component {
  static propTypes = {
    columns: PropTypes.object,
    count: PropTypes.number,
    extensions: PropTypes.object.isRequired,
    getCurrentURL: PropTypes.func.isRequired,
    ordering: PropTypes.string,
    pageNumber: PropTypes.number,
    push: PropTypes.func.isRequired,
  };

  static defaultProps = {
    columns: null,
    count: null,
    ordering: null,
    pageNumber: null,
    searchText: null,
    status: null,
  }

  static columnRenderers = {
    name() {
      return (
        <Table.Column
          title="Name"
          dataIndex="name"
          key="name"
          render={Listing.renderLinkedText}
        />
      );
    },

    xpi() {
      return (
        <Table.Column
          title="XPI URL"
          dataIndex="xpi"
          key="xpi"
          render={Listing.renderLinkedText}
        />
      );
    },
  }

  static renderLinkedText(text, record) {
    return <Link href={`/extension/${record.id}`}>{text}</Link>;
  }

  getFilters() {
    const { ordering } = this.props;

    const filters = {
      ordering,
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
    push(`/extension/${record.id}`);
  }

  render() {
    const { columns, count, extensions, ordering, pageNumber } = this.props;

    return (
      <div>
        <QueryExtensionListingColumns />
        <QueryMultipleExtensions pageNumber={pageNumber} />

        <ListingActionBar />

        <LoadingOverlay>
          <DataList
            columns={columns}
            columnRenderers={Listing.columnRenderers}
            dataSource={extensions.toJS()}
            ordering={ordering}
            onRowClick={this.handleRowClick}
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

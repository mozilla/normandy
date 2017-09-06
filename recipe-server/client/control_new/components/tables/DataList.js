import { Table } from 'antd';
import autobind from 'autobind-decorator';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { push as pushAction } from 'redux-little-router';
import { isEmpty, mapObject } from 'underscore';

import {
  getCurrentURL as getCurrentURLSelector,
} from 'control_new/state/router/selectors';


@connect(
  state => ({
    getCurrentURL: queryParams => getCurrentURLSelector(state, queryParams),
  }),
  {
    push: pushAction,
  },
)
@autobind
export default class DataList extends React.PureComponent {
  static propTypes = {
    columnRenderers: PropTypes.object.isRequired,
    columns: PropTypes.instanceOf(List).isRequired,
    dataSource: PropTypes.array.isRequired,
    getCurrentURL: PropTypes.func.isRequired,
    ordering: PropTypes.string,
    onRowClick: PropTypes.func,
    push: PropTypes.func.isRequired,
  }

  static defaultProps = {
    ordering: null,
    onRowClick: null,
  }

  static getSortOrder = (field, ordering) => {
    if (ordering && ordering.endsWith(field)) {
      return ordering.startsWith('-') ? 'descend' : 'ascend';
    }
    return false;
  }

  handleChangeSortFilters(pagination, filters, sorter) {
    const { getCurrentURL, push } = this.props;
    const filterParams = mapObject(filters, values => (values && values.join(',')));

    let ordering;
    if (!isEmpty(sorter)) {
      const prefix = sorter.order === 'ascend' ? '' : '-';
      ordering = `${prefix}${sorter.field}`;
    }

    push(getCurrentURL({
      page: undefined, // Return to the first page
      ordering,
      ...filterParams,
    }));
  }

  render() {
    const { columnRenderers, columns, dataSource, onRowClick } = this.props;

    return (
      <Table
        className="list"
        dataSource={dataSource}
        pagination={false}
        rowKey="id"
        onChange={this.handleChangeSortFilters}
        onRowClick={onRowClick}
        bordered
      >
        {columns.map(column => columnRenderers[column](this.props))}
      </Table>
    );
  }
}

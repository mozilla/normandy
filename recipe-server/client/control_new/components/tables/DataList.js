import { Table } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push } from 'redux-little-router';
import { isEmpty, mapObject } from 'underscore';

import {
  getCurrentURL,
  getQueryParameter,
} from 'control_new/state/router/selectors';


@connect(
  state => ({
    getCurrentURL: queryParams => getCurrentURL(state, queryParams),
  }),
  dispatch => (
    bindActionCreators(
      {
        push,
      }, dispatch
    )
  )
)
@autobind
export default class DataList extends React.Component {
  static propTypes = {
    columnRenderers: PropTypes.object.isRequired,
    columns: PropTypes.object.isRequired,
    dataSource: PropTypes.array.isRequired,
    getCurrentURL: PropTypes.func.isRequired,
    ordering: PropTypes.string,
    push: PropTypes.func.isRequired,
  }

  static getSortOrder = (field, ordering) => {
    if (ordering && ordering.endsWith(field)) {
      return ordering.startsWith('-') ? 'descend' : 'ascend';
    }
    return false;
  }

  handleChangeSortFilters(pagination, filters, sorter) {
    const filterParams = mapObject(filters, values => values.join(',') || undefined);

    let ordering;
    if (!isEmpty(sorter)) {
      const prefix = sorter.order === 'ascend' ? '' : '-';
      ordering = prefix + sorter.field;
    }

    this.props.push(
      this.props.getCurrentURL({
        ordering,
        ...filterParams,
      })
    );
  }

  render() {
    const { columnRenderers, columns, dataSource } = this.props;

    return (
      <Table
        className="list"
        dataSource={dataSource}
        pagination={false}
        rowKey="id"
        onChange={this.handleChangeSortFilters}
        bordered
      >
        {columns.map(column => columnRenderers[column](this.props))}
      </Table>
    );
  }
}

import { Button, Col, Row } from 'antd';
import autobind from 'autobind-decorator';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { push as pushAction, Link } from 'redux-little-router';

import CheckboxMenu from 'control_new/components/common/CheckboxMenu';
import {
  saveExtensionListingColumns as saveExtensionListingColumnsAction,
} from 'control_new/state/app/extensions/actions';
import {
  getExtensionListingColumns,
} from 'control_new/state/app/extensions/selectors';
import {
  getCurrentURL as getCurrentURLSelector,
} from 'control_new/state/router/selectors';

@connect(
  state => ({
    columns: getExtensionListingColumns(state),
    getCurrentURL: queryParams => getCurrentURLSelector(state, queryParams),
  }),
  {
    push: pushAction,
    saveExtensionListingColumns: saveExtensionListingColumnsAction,
  },
)
@autobind
export default class ListingActionBar extends React.Component {
  static propTypes = {
    columns: PropTypes.instanceOf(List).isRequired,
    getCurrentURL: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
    saveExtensionListingColumns: PropTypes.func.isRequired,
  };

  handleChangeSearch(value) {
    const { getCurrentURL, push } = this.props;
    push(getCurrentURL({ searchText: value || undefined }));
  }

  render() {
    const { columns, saveExtensionListingColumns } = this.props;
    return (
      <Row gutter={16} className="list-action-bar">
        <Col span={16}>
          <CheckboxMenu
            checkboxes={columns.toJS()}
            label="Columns"
            onChange={saveExtensionListingColumns}
            options={[
              { label: 'Name', value: 'name' },
              { label: 'XPI URL', value: 'xpi' },
            ]}
          />
        </Col>
        <Col span={8} className="righted">
          <Link href="/extension/new">
            <Button type="primary" icon="plus">New Extension</Button>
          </Link>
        </Col>
      </Row>
    );
  }
}

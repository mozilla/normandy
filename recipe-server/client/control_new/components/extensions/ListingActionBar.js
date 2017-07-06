import { Button, Col, Row } from 'antd';
import autobind from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push as pushAction, Link } from 'redux-little-router';

import CheckboxMenu from 'control_new/components/common/CheckboxMenu';
import * as recipeActions from 'control_new/state/extensions/actions';
import {
  getExtensionListingColumns,
} from 'control_new/state/extensions/selectors';
import * as routerSelectors from 'control_new/state/router/selectors';

@connect(
  state => ({
    columns: getExtensionListingColumns(state),
    getCurrentURL: queryParams => routerSelectors.getCurrentURL(state, queryParams),
  }),
  dispatch => (
    bindActionCreators({
      push: pushAction,
      saveExtensionListingColumns: recipeActions.saveExtensionListingColumns,
    }, dispatch)
  ),
)
@autobind
export default class ListingActionBar extends React.Component {
  static propTypes = {
    columns: PropTypes.object.isRequired,
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
          <Link href="/extensions/new">
            <Button type="primary" icon="plus">New Extension</Button>
          </Link>
        </Col>
      </Row>
    );
  }
}

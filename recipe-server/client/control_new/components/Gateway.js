import React from 'react';
import PropTypes from 'prop-types';
import autobind from 'autobind-decorator';
import { push } from 'redux-little-router';

import { connect } from 'react-redux';
import { Row, Col, Icon } from 'antd';

@autobind
export class Gateway extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
  }

  gotoRecipes() {
    this.props.dispatch(push('/recipes'));
  }

  gotoExtensions() {
    this.props.dispatch(push('/extensions'));
  }

  render() {
    return (
      <Row className="page-gateway" type="flex" justify="space-around" align="top">
        <Col className="gw-col" span={8} onClick={this.gotoRecipes}>
          <h2 className="title">Recipes</h2>
          <Icon type="book" />
          <p>This is for normal recipes and stuff or whatever.</p>
        </Col>
        <Col className="gw-col" span={8} onClick={this.gotoExtensions}>
          <h2 className="title">Extensions</h2>
          <Icon type="api" />
          <p>This is for craAaAzy extensions and stuff.</p>
        </Col>
      </Row>
    );
  }
}

export default connect(
  null,
  dispatch => ({ dispatch }),
)(Gateway);


import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'redux-little-router';

import { connect } from 'react-redux';
import { Row, Col, Icon } from 'antd';

export function Gateway() {
  return (
    <Row className="page-gateway" type="flex" justify="space-around" align="top">
      <Col className="gw-col" span={8}>
        <h2 className="title">Recipes</h2>
        <Icon type="book" />
        <p>This is for normal recipes and stuff or whatever.</p>
        <Link href="/recipes">Go to Recipes</Link>
      </Col>
      <Col className="gw-col" span={8}>
        <h2 className="title">Extensions</h2>
        <Icon type="api" />
        <p>This is for craAaAzy extensions and stuff.</p>
        <Link href="/extensions">Go to Extensions</Link>
      </Col>
    </Row>
  );
}

Gateway.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

export default connect(
  null,
  dispatch => ({ dispatch }),
)(Gateway);


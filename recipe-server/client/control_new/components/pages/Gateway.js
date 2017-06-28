import React from 'react';
import { Link } from 'redux-little-router';

import { Row, Col, Icon } from 'antd';

export default function Gateway() {
  return (
    <Row className="page-gateway" type="flex" justify="space-around" align="top">
      <Col className="gw-col" span={8}>
        <h2 className="title">Recipes</h2>
        <Icon type="book" />
        <p>Basic SHIELD recipes</p>
        <Link href="/recipes">Go to Recipes</Link>
      </Col>
      <Col className="gw-col" span={8}>
        <h2 className="title">Extensions</h2>
        <Icon type="api" />
        <p>Deployed SHIELD WebExtensions</p>
        <Link href="/extensions">Go to Extensions</Link>
      </Col>
    </Row>
  );
}

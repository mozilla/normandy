import React from 'react';
import { Link } from 'redux-little-router';

import { Row, Col, Icon, Card } from 'antd';

export default function Gateway() {
  return (
    <Row className="page-gateway" type="flex" justify="space-around" align="top">
      <Col className="gw-col" span={8}>
        <Card title="Recipes">
          <Icon type="book" />
          <p>Basic SHIELD recipes</p>
          <Link href="/recipes">Go to Recipes</Link>
        </Card>
      </Col>
      <Col className="gw-col" span={8}>
        <Card title="Extensions">
          <Icon type="code" />
          <p>SHIELD WebExtensions</p>
          <Link href="/extensions">Go to Extensions</Link>
        </Card>
      </Col>
    </Row>
  );
}

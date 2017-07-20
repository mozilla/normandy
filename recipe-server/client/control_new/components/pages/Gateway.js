import React from 'react';
import { Link } from 'redux-little-router';

import { Row, Col, Icon, Card } from 'antd';


export default class Gateway extends React.Component {
  render() {
    return (
      <Row className="page-gateway" type="flex" justify="space-around" align="top">
        <Col className="gw-col" xs={24} sm={10} md={8}>
          <Card title="Recipes">
            <Icon type="book" />
            <p>Basic SHIELD recipes</p>
            <Link href="/recipe">Go to Recipes</Link>
          </Card>
        </Col>
        <Col className="gw-col" xs={24} sm={10} md={8}>
          <Card title="Extensions">
            <Icon type="code" />
            <p>SHIELD WebExtensions</p>
            <Link href="/extension">Go to Extensions</Link>
          </Card>
        </Col>
      </Row>
    );
  }
}

import { Card, Row, Col } from 'antd';
import autobind from 'autobind-decorator';
import React from 'react';

import ShieldIdenticon from 'control_new/components/common/ShieldIdenticon';


@autobind
export default class ShieldTestPage extends React.Component {
  constructor(props) {
    super(props);

    const seeds = [];
    for (let i = 0; i < 32; i++) {
      seeds.push(Math.random().toString(36).slice(2));
    }

    this.state = { seeds };
  }

  render() {
    const shields = this.state.seeds.map(seed => (
      <a href={`/api/v2/identicon/v1:${seed}.svg`} key={seed}>
        <Card className="shield-card">
          <Row>
            <Col span={12} style={{ textAlign: 'center' }}>
              <ShieldIdenticon seed={seed} size={16} />
              <ShieldIdenticon seed={seed} size={32} />
            </Col>
            <Col span={12}>
              <ShieldIdenticon seed={seed} size={64} />
            </Col>
          </Row>
          <ShieldIdenticon seed={seed} size={128} />
          <span className="seed">{seed}</span>
        </Card>
      </a>
    ));

    return (
      <div className="page-tests-shields">
        <h1>Shield Demo</h1>
        <div className="shields-demo">
          {shields}
        </div>
      </div>
    );
  }
}

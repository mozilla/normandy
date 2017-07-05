import { Card, Row, Col } from 'antd';
import autobind from 'autobind-decorator';
import { fromJS, Set, Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import ShieldIdenticon, { colors, badColors as originalBadColors } from 'control_new/components/common/ShieldIdenticon';


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
      <Card className='shield-card'>
        <Row>
          <Col span={12} style={{ textAlign: 'center' }}>
            <ShieldIdenticon key={`${seed}-16`} seed={seed} size={16} />
            <ShieldIdenticon key={`${seed}-32`} seed={seed} size={32} />
          </Col>
          <Col span={12}>
            <ShieldIdenticon key={`${seed}-64`} seed={seed} size={64} />
          </Col>
        </Row>
        <ShieldIdenticon key={`${seed}-128`} seed={seed} size={128} />
        <span className='seed'>{seed}</span>
      </Card>
    ));

    return (
      <div className="page-tests-shields">
        <h1>Shield demo</h1>
        <div className="shields-demo">
          {shields}
        </div>
      </div>
    );
  }
}

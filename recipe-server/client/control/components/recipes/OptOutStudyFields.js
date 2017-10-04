import { Col, Row, Input } from 'antd';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import SwitchBox from 'control/components/forms/SwitchBox';
import FormItem from 'control/components/forms/FormItem';
import ExtensionSelect from 'control/components/extensions/ExtensionSelect';

import { connectFormProps } from 'control/utils/forms';

@connectFormProps
export default class OptOutStudyFields extends React.PureComponent {
  static propTypes = {
    disabled: PropTypes.bool,
    recipeArguments: PropTypes.instanceOf(Map).isRequired,
  };

  static defaultProps = {
    disabled: false,
    recipeArguments: new Map(),
  };

  render() {
    const {
      recipeArguments,
      disabled,
    } = this.props;
    return (
      <Row>
        <p className="action-info">Enroll the user in a study which they can remove themselves from.</p>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <FormItem
              label="Study Name"
              name="arguments.name"
              initialValue={recipeArguments.get('name', '')}
            >
              <Input disabled={disabled} />
            </FormItem>
            <FormItem
              label="Study Description"
              name="arguments.description"
              initialValue={recipeArguments.get('description', '')}
            >
              <Input type="textarea" rows="3" disabled={disabled} />
            </FormItem>
          </Col>

          <Col xs={24} md={12}>
            <FormItem
              label="Extension"
              name="arguments.addonUrl"
              initialValue={recipeArguments.get('addonUrl', '')}
            >
              <ExtensionSelect disabled={disabled} />
            </FormItem>

            <FormItem
              label="Prevent New Enrollment"
              name="arguments.isEnrollmentPaused"
              initialValue={recipeArguments.get('isEnrollmentPaused', false)}
            >
              <SwitchBox disabled={disabled}>
                Prevents new users from joining this study&nbsp;cohort. <br /> Existing
                users will remain in&nbsp;the&nbsp;study.
              </SwitchBox>
            </FormItem>
          </Col>
        </Row>
      </Row>
    );
  }
}

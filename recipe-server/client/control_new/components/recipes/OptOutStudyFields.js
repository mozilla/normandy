import { Col, Row, Input, Select } from 'antd';
import { Map, List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import SwitchBox from 'control_new/components/forms/SwitchBox';
import FormItem from 'control_new/components/forms/FormItem';
import { connectFormProps } from 'control_new/utils/forms';

import { getExtensionListing } from 'control_new/state/app/extensions/selectors';

@connectFormProps
@connect(
  state => ({
    extensions: getExtensionListing(state),
  }),
)
export default class OptOutStudyFields extends React.Component {
  static propTypes = {
    disabled: PropTypes.bool,
    extensions: PropTypes.instanceOf(List).isRequired,
    recipeArguments: PropTypes.instanceOf(Map).isRequired,
  };

  static defaultProps = {
    disabled: false,
    extensions: new List(),
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
              label="Add-on Extension"
              name="arguments.addonUrl"
              initialValue={recipeArguments.get('addonUrl', '')}
            >
              <Select disabled={disabled}>
                {this.props.extensions.map(extension =>
                  (<Select.Option key={extension.get('id')} value={extension.get('xpi')}>
                    {extension.get('name')}
                  </Select.Option>),
                )}
              </Select>
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

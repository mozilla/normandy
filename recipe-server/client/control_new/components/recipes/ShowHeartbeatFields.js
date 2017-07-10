import { Checkbox, Input, InputNumber, Select } from 'antd';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import { connectFormProps, FormItem } from 'control_new/components/common/forms';


@connectFormProps
export default class ShowHeartbeatFields extends React.Component {
  static propTypes = {
    disabled: PropTypes.bool,
    form: PropTypes.object.isRequired,
    recipeArguments: PropTypes.instanceOf(Map).isRequired,
  };

  static defaultProps = {
    disabled: false,
    recipeArguments: new Map(),
  };

  render() {
    const {
      form,
      recipeArguments,
      disabled,
    } = this.props;
    return (
      <div>
        <p className="action-info">Shows a single message or survey prompt to the user.</p>
        <FormItem
          label="Survey ID"
          name="arguments.surveyId"
          initialValue={recipeArguments.get('surveyId', '')}
        >
          <Input disabled={disabled} />
        </FormItem>
        <FormItem
          label="Message"
          name="arguments.message"
          initialValue={recipeArguments.get('message', '')}
        >
          <Input disabled={disabled} />
        </FormItem>
        <FormItem
          label="Engagement Button Label"
          name="arguments.engagementButtonLabel"
          initialValue={recipeArguments.get('engagementButtonLabel', '')}
        >
          <Input disabled={disabled} />
        </FormItem>
        <FormItem
          label="Thanks Message"
          name="arguments.thanksMessage"
          initialValue={recipeArguments.get('thanksMessage', '')}
        >
          <Input disabled={disabled} />
        </FormItem>
        <FormItem
          label="Post-Answer URL"
          name="arguments.postAnswerUrl"
          initialValue={recipeArguments.get('postAnswerUrl', '')}
        >
          <Input disabled={disabled} />
        </FormItem>
        <FormItem
          label="Learn More Message"
          name="arguments.learnMoreMessage"
          initialValue={recipeArguments.get('learnMoreMessage', '')}
        >
          <Input disabled={disabled} />
        </FormItem>
        <FormItem
          label="Learn More URL"
          name="arguments.learnMoreUrl"
          initialValue={recipeArguments.get('learnMoreUrl', '')}
        >
          <Input disabled={disabled} />
        </FormItem>
        <FormItem
          label="How often should the prompt be shown?"
          name="arguments.repeatOption"
          initialValue={recipeArguments.get('repeatOption', 'once')}
        >
          <Select disabled={disabled}>
            <Select.Option value="once">
              Do not show this prompt to users more than once.
            </Select.Option>
            <Select.Option value="nag">
              Show this prompt until the user clicks the button/stars,
              and then never again.
            </Select.Option>
            <Select.Option value="xdays">
              Allow re-prompting users who have already seen this prompt
              after {form.getFieldValue('arguments.repeatEvery') || 'X'}
              days since they last saw it.
            </Select.Option>
          </Select>
        </FormItem>
        {form.getFieldValue('arguments.repeatOption') === 'xdays' &&
          <FormItem
            label="Days before user is re-prompted"
            name="arguments.repeatEvery"
            initialValue={recipeArguments.get('repeatEvery', 'once')}
          >
            <InputNumber disabled={disabled} />
          </FormItem>
        }
        <FormItem
          name="arguments.includeTelemetryUUID"
          initialValue={recipeArguments.get('includeTelemetryUUID', false)}
          config={{ valuePropName: 'checked' }}
        >
          <Checkbox disabled={disabled}>
            Include unique user ID in Post-Answer URL (and Telemetry)
          </Checkbox>
        </FormItem>
      </div>
    );
  }
}

import { Col, Input, InputNumber, Row, Select, Tooltip } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import DocumentUrlInput from 'control/components/forms/DocumentUrlInput';
import CheckBox from 'control/components/forms/CheckBox';
import FormItem from 'control/components/forms/FormItem';
import { connectFormProps } from 'control/utils/forms';


@connectFormProps
export default class ShowHeartbeatFields extends React.PureComponent {
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

    const repeatCount = form.getFieldValue('arguments.repeatEvery')
      || recipeArguments.get('repeatEvery', 'X');

    return (
      <Row>
        <p className="action-info">Shows a single message or survey prompt to the user.</p>
        <Col sm={24} md={11}>
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
        </Col>
        <Col sm={24} md={{ span: 12, offset: 1 }}>
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
            className="post-answer-url"
            label="Post-Answer URL"
            name="arguments.postAnswerUrl"
            initialValue={recipeArguments.get('postAnswerUrl', '')}
          >
            <DocumentUrlInput disabled={disabled} />
          </FormItem>
          <FormItem
            name="arguments.includeTelemetryUUID"
            label="Include Telemetry UUID?"
            initialValue={recipeArguments.get('includeTelemetryUUID', false)}
          >
            <CheckBox disabled={disabled}>
              Include UUID in Post-Answer URL and Telemetry
            </CheckBox>
          </FormItem>
        </Col>
        <Col sm={24}>
          <FormItem
            label="How often should the prompt be shown?"
            name="arguments.repeatOption"
            initialValue={recipeArguments.get('repeatOption', 'once')}
          >
            <RepeatSelect repeatCount={repeatCount} />
          </FormItem>
          {form.getFieldValue('arguments.repeatOption') === 'xdays' &&
            <FormItem
              rules={[{
                required: true,
                message: 'This field must be a number greater than zero.',
                validator: (rule, value, callback) => {
                  if (typeof value === 'undefined' || value === null) {
                    callback('This field is required.');
                  } else if (parseFloat(value, 10) <= 0) {
                    callback('Number must be greater than zero.');
                  } else {
                    // No message indicates a successful validation.
                    callback();
                  }
                },
              }]}
              label="Days before user is re-prompted"
              name="arguments.repeatEvery"
              initialValue={recipeArguments.get('repeatEvery', 'X')}
            >
              <InputNumber disabled={disabled} />
            </FormItem>
          }
        </Col>
      </Row>
    );
  }
}

@autobind
class RepeatSelect extends React.PureComponent {
  static propTypes = {
    repeatCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };

  static defaultProps = {
    repeatCount: 'X',
  };

  getOptions() {
    const { repeatCount } = this.props;
    const dayUnit = repeatCount === 'X' || repeatCount !== 1 ? 'days' : 'day';

    return [{
      name: 'once',
      label: 'Show this prompt once.',
      tooltip: 'Prompt the user only once, regardless if they interact with it or not.',
    }, {
      name: 'nag',
      label: 'Show until the user interacts with the hearbeat prompt, then never again.',
      tooltip: `Prompts the user every day until they click Learn More, the engagement button, or
        submit a star rating, then never appears again.`,
    }, {
      name: 'xdays',
      label: `Show users every ${repeatCount === 1 ? 'day' : `${repeatCount} ${dayUnit}`}.`,
      tooltip: `Prompts the user as soon as possible, then waits ${repeatCount} ${dayUnit} to appear
        again.`,
    }];
  }

  render() {
    return (
      <Select className="repeat-select" {...this.props}>
        {
          this.getOptions().map(({ name, label, tooltip }, index) =>
            (<Select.Option value={name} key={index + label} title=" ">
              <Tooltip title={tooltip} placement="top">
                {label}
              </Tooltip>
            </Select.Option>),
          )
        }
      </Select>
    );
  }
}

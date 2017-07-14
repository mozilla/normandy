import { Button, Form, Icon, Input, Upload } from 'antd';
import autobind from 'autobind-decorator';
import { is, Map } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import { createForm, FormItem } from 'control_new/components/common/forms';
import FormActions from 'control_new/components/common/FormActions';


/**
 * Form for editing XPIs uploaded to the service.
 *
 * The XPI field does not use normal Ant field wrappers due to how the Upload
 * component works. Instead, the resulting file is stored in the form state and
 * appended to the form values after validation.
 */
@createForm({
  /**
   * Add the XPI file to the form values since it is handled outside of the
   * rest of the form.
   */
  validateFields(values) {
    const { xpiFile } = this.state;
    if (xpiFile) {
      values.xpi = xpiFile;
    }
    return values;
  },
})
@autobind
export default class ExtensionForm extends React.Component {
  static propTypes = {
    extension: PropTypes.instanceOf(Map),
    form: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
  };

  static defaultProps = {
    extension: new Map(),
  };

  state = {
    xpiName: null,
    xpiUrl: null,
    xpiFile: null,
  };

  componentWillMount() {
    const { extension } = this.props;
    if (extension) {
      this.setInitialValues(extension);
    }
  }

  componentWillReceiveProps(newProps) {
    // Reset form if the extension changed
    if (!is(newProps.extension, this.props.extension)) {
      this.setInitialValues(newProps.extension);
    }
  }

  /**
   * Reset the form values for a new extension.
   * @param {Object} extension
   */
  setInitialValues(extension) {
    // Initial values are mostly handled via props, but if the extension
    // changes, we need to reset the values stored in the state.
    this.props.form.resetFields();

    let stateChange;
    if (extension) {
      stateChange = {
        xpiName: extension.get('xpi'),
        xpiUrl: extension.get('xpi'),
      };
    } else {
      stateChange = {
        xpiName: null,
        xpiUrl: null,
      };
    }
    this.setState(stateChange);
  }

  getUploadFileList() {
    const { xpiName, xpiUrl } = this.state;
    const fileList = [];

    if (xpiName) {
      fileList.push({
        uid: -1,
        name: xpiName,
        url: xpiUrl,
      });
    }

    return fileList;
  }

  /**
   * Handle selection of an XPI file before ant tries to upload it.
   * @param  {File} file
   */
  beforeUpload(file) {
    this.setState({
      xpiName: file.name,
      xpiFile: file,
      xpiUrl: null,
    });

    // Returning false stops the Upload component from trying to send
    // the file to the server itself.
    return false;
  }

  render() {
    const { extension, onSubmit } = this.props;
    return (
      <Form onSubmit={onSubmit}>
        <FormItem
          name="name"
          label="Name"
          initialValue={extension.get('name')}
          rules={[
            { required: true },
          ]}
        >
          <Input />
        </FormItem>
        <FormItem label="Extension (XPI)">
          <Upload
            beforeUpload={this.beforeUpload}
            accept=".xpi"
            fileList={this.getUploadFileList()}
          >
            <Button>
              <Icon type="upload" /> Upload XPI
            </Button>
          </Upload>
        </FormItem>
        <FormActions>
          <FormActions.Primary>
            <Button type="primary" htmlType="submit">Save</Button>
          </FormActions.Primary>
        </FormActions>
      </Form>
    );
  }
}

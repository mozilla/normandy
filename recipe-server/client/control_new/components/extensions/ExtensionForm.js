import { Button, Form, Icon, Input, Upload } from 'antd';
import autobind from 'autobind-decorator';
import { is, Map } from 'immutable';
import pt from 'prop-types';
import React from 'react';

import BaseAntForm from 'control_new/components/common/BaseAntForm';
import FormActions from 'control_new/components/common/FormActions';


/**
 * Form for editing XPIs uploaded to the service.
 *
 * The XPI field does not use normal Ant field wrappers due to how the Upload
 * component works. Instead, the resulting file is stored in the form state and
 * appended to the form values after validation.
 */
@autobind
export class _ExtensionForm extends BaseAntForm {
  static propTypes = {
    extension: pt.instanceOf(Map),
    form: pt.object,
  }

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
   * Add the XPI file to the form values since it is handled outside of the
   * rest of the form.
   * @return {Promise}
   */
  async validateFields() {
    const values = await super.validateFields();
    const { xpiFile } = this.state;
    if (xpiFile) {
      values.xpi = xpiFile;
    }
    return values;
  }

  render() {
    const { extension = new Map() } = this.props;
    return (
      <Form onSubmit={this.handleSubmit}>
        <this.FormItem
          name="name"
          label="Name"
          initialValue={extension.get('name')}
          rules={[
            { required: true },
          ]}
        >
          <Input />
        </this.FormItem>
        <Form.Item label="Extension (XPI)">
          <Upload
            beforeUpload={this.beforeUpload}
            accept=".xpi"
            fileList={this.getUploadFileList()}
          >
            <Button>
              <Icon type="upload" /> Upload XPI
            </Button>
          </Upload>
        </Form.Item>
        <FormActions>
          <FormActions.Primary>
            <Button type="primary" htmlType="submit">Save</Button>
          </FormActions.Primary>
        </FormActions>
      </Form>
    );
  }
}

export default Form.create({})(_ExtensionForm);

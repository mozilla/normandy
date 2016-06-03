import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import ConsoleLogForm from '../../../static/control/js/components/action_forms/ConsoleLogForm.jsx';

const setup = () => {
  let props = {
    fields: {
      message: { dirty: false, isActive: false, initialValue: 'Lorem ipsum dolor' }
    }
  }

  const renderer = TestUtils.createRenderer();
  renderer.render(<ConsoleLogForm {...props} />);
  const output = renderer.getRenderOutput();

  return {
    output,
    props
  }
};

const { output, props } = setup();

describe('ConsoleLogForm', () => {

  it('renders the correct element', () => {
    expect(output.type).toEqual('div');
  });

  it('renders the message field with a label and text input', () => {
    let field = output.props.children;
    expect(field.key).toEqual('message');
    expect(field.props.children.length).toEqual(2);

    let label = field.props.children[0];
    expect(label.type).toEqual('label');
    expect(label.props.children).toEqual('Message');

    let input = field.props.children[1];
    expect(input.type).toEqual('input');
    expect(input.props.type).toEqual('text');
    expect(input.props.field).toEqual(props.fields.message);
  });

});

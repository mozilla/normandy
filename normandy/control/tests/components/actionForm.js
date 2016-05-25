import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import { ActionForm } from '../../static/control/js/components/ActionForm.jsx';

const setup = () => {
  let props = {
    fields: { "message": {} },
    name: "console-log",
    recipe: { "id": 1, "name": "Lorem Ipsum", "enabled": true, "filter_expression": "()", "action_name": "console-log" },
    arguments_schema: {"type":"object","title":"Log a message to the console","$schema":"http://json-schema.org/draft-04/schema#","properties":{"message":{"type":"string","description":"Message to log to the console","default":""}},"required":["message"]},
  }

  const renderer = TestUtils.createRenderer();
  renderer.render(<ActionForm {...props} />);
  const output = renderer.getRenderOutput();

  return {
    props,
    output,
    renderer
  }
};

const { output } = setup();

describe('ActionForm', () => {

  it('renders the correct elements', () => {
    expect(output.type).toEqual('div');
    expect(output.props.id).toEqual('action-configuration');
    expect(output.props.children.length).toEqual(3);
  });

});

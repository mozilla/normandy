import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import HeartbeatForm from '../../../static/control/js/components/action_forms/HeartbeatForm.jsx';

const props = {
  fields: {
    surveyId: {},
    defaults: {
      message: { value: '' },
      engagementButtonLabel: { value: '' }
    },
    surveys: [
      {
        title: { value: 'Survey 1', initialValue: 'Survey 1', onChange: fn => fn },
        message: { value: 'Message 1', onChange: fn => fn },
        weight: { value: 1, onChange: fn => fn }
      },
      {
        title: { value: 'Survey 2', initialValue: 'Survey 2', onChange: fn => fn },
        message: { value: 'Message 2', onChange: fn => fn },
        weight: { value: 0, onChange: fn => fn }
      }
    ]
  }
}

props.fields.surveys.addField = jasmine.createSpy();
props.fields.surveys.removeField = jasmine.createSpy();

const heartbeatFormComponent = TestUtils.renderIntoDocument(<HeartbeatForm {...props} />);
const surveyList = TestUtils.findRenderedDOMComponentWithTag(heartbeatFormComponent, 'ul');

describe('HeartbeatForm', () => {

  it('renders the component', () => {
    expect(TestUtils.isCompositeComponent(heartbeatFormComponent)).toEqual(true);
  });


  describe('survey list', () => {

    it('lists existing surveys by title', () => {
      expect(surveyList.children.length).toEqual(2);
      expect(surveyList.children[0].innerText).toEqual('Survey 1');
    });

    it('calls addField when clicking the Add Survey button', () => {
      let addFieldButton = TestUtils.findRenderedDOMComponentWithClass(heartbeatFormComponent, 'add-field');
      TestUtils.Simulate.click(addFieldButton);
      expect(props.fields.surveys.addField).toHaveBeenCalled();
    });

    it('calls removeField when clicking the x icon for a survey', () => {
      let removeFieldButton = TestUtils.scryRenderedDOMComponentsWithClass(heartbeatFormComponent, 'delete-field');
      TestUtils.Simulate.click(removeFieldButton[1]);
      expect(props.fields.surveys.removeField).toHaveBeenCalled();
      expect(props.fields.surveys.removeField).toHaveBeenCalledWith(1);
    });

  });


  describe('showing default fields on initial render', () => {
    let surveyForm = TestUtils.findAllInRenderedTree(heartbeatFormComponent, (component => component.id === 'survey-form'))[0];

    it('displays Default Values header', () => {
      expect(surveyForm.children[0].tagName).toEqual('H4');
      expect(surveyForm.children[0].innerText).toEqual('Default Survey Values');
    });

    it('does not display the return to defaults element', () => {
      expect(surveyForm.getElementsByClassName('return-to-defaults').length).toEqual(0);
    });

    it('shows only the default fields', () => {
      expect(surveyForm.children.length).toEqual(3);
      expect(surveyForm.children[1].children[0].innerText).toEqual('message');
      expect(surveyForm.children[2].children[0].innerText).toEqual('engagement button label');
    });

  });


  describe('showing a selected survey', () => {
    let surveyForm = TestUtils.findAllInRenderedTree(heartbeatFormComponent, (component => component.id === 'survey-form'))[0];

    beforeAll(() => {
      TestUtils.Simulate.click(surveyList.children[0]);
    });

    afterAll(() => {
      TestUtils.Simulate.click(surveyForm.children[0]);
    });

    it('displays the survey title header', () => {
      expect(surveyForm.children[1].innerText).toEqual('Survey 1');
    });

    it('displays the return to defaults element', () => {
      expect(surveyForm.children[0].className).toEqual('return-to-defaults');
    });

    it('shows the selected survey fields with appropriate values', () => {
      expect(surveyForm.children.length).toEqual(5);

      let titleField = surveyForm.children[2];
      expect(titleField.children[0].innerText).toEqual('title');
      expect(titleField.children[1].value).toEqual('Survey 1');

      let messageField = surveyForm.children[3];
      expect(messageField.children[0].innerText).toEqual('message');
      expect(messageField.children[1].value).toEqual('Message 1');

      let weightField = surveyForm.children[4];
      expect(weightField.children[0].innerText).toEqual('weight');
      expect(weightField.children[1].value).toEqual('1');
    });

    it('updates the selected survey form when clicking a new survey', () => {
      TestUtils.Simulate.click(surveyList.children[1]);

      expect(surveyForm.children.length).toEqual(5);
      expect(surveyForm.children[1].innerText).toEqual('Survey 2');

      let titleField = surveyForm.children[2];
      expect(titleField.children[1].value).toEqual('Survey 2');

      let messageField = surveyForm.children[3];
      expect(messageField.children[1].value).toEqual('Message 2');

      let weightField = surveyForm.children[4];
      expect(weightField.children[1].value).toEqual('0');
    });

  });

});

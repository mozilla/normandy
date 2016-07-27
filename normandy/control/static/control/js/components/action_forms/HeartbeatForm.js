import React, { PropTypes as pt } from 'react';
import classNames from 'classnames';
import { _ } from 'underscore';
import FormField from '../form_fields/FormFieldWrapper.js';

export const HeartbeatFormFields = [
  'surveyId',
  'defaults.message',
  'defaults.engagementButtonLabel',
  'defaults.thanksMessage',
  'defaults.postAnswerUrl',
  'defaults.learnMoreMessage',
  'defaults.learnMoreUrl',
  'surveys[].title',
  'surveys[].message',
  'surveys[].engagementButtonLabel',
  'surveys[].thanksMessage',
  'surveys[].postAnswerUrl',
  'surveys[].learnMoreMessage',
  'surveys[].learnMoreUrl',
  'surveys[].weight',
];

const SurveyListItem = props => {
  const { survey, surveyIndex, isSelected, hasErrors, deleteSurvey, onClick } = props;

  return (
    <li className={classNames({ active: isSelected, invalid: hasErrors })} onClick={onClick}>
      {survey.title.value || 'Untitled Survey'}
      <span
        title="Delete this survey"
        className="delete-field"
        data-survey-index={surveyIndex}
        onClick={deleteSurvey}
      >
        <i className="fa fa-times red"></i>
      </span>
    </li>
  );
};
SurveyListItem.propTypes = {
  survey: pt.object.isRequired,
  surveyIndex: pt.number.isRequired,
  isSelected: pt.bool.isRequired,
  hasErrors: pt.bool.isRequired,
  deleteSurvey: pt.func.isRequired,
  onClick: pt.func,
};

const SurveyForm = props => {
  const { selectedSurvey, fields, showDefaults } = props;
  const surveyObject = selectedSurvey || fields.defaults;
  let headerText = 'Default Survey Values';
  let showAdditionalSurveyFields = false;
  let containerClasses = classNames('fluid-8', { active: selectedSurvey });

  if (selectedSurvey) {
    showAdditionalSurveyFields = true;
    headerText = selectedSurvey.title.initialValue || 'New survey';
  }

  return (
    <div id="survey-form" className={containerClasses}>
      {selectedSurvey &&
        <span className="return-to-defaults" onClick={showDefaults}>
          <i className="fa fa-long-arrow-left pre"></i> Return to defaults
        </span>
      }
      <h4>{headerText}</h4>

      {showAdditionalSurveyFields &&
        <FormField label="Title" field={surveyObject.title} />
      }

      <FormField label="Message" field={surveyObject.message} />
      <FormField label="Engagement Button Label" field={surveyObject.engagementButtonLabel} />
      <FormField label="Thanks Message" field={surveyObject.thanksMessage} />
      <FormField label="Post Answer Url" field={surveyObject.postAnswerUrl} />
      <FormField label="Learn More Message" field={surveyObject.learnMoreMessage} />
      <FormField label="Learn More Url" field={surveyObject.learnMoreUrl} />

      {showAdditionalSurveyFields &&
        <FormField label="Weight" type="number" min="1" field={surveyObject.weight} />
      }

    </div>
  );
};
SurveyForm.propTypes = {
  selectedSurvey: pt.object.isRequired,
  fields: pt.object.isRequired,
  showDefaults: pt.func,
};

export default class HeartbeatForm extends React.Component {
  static propTypes = {
    fields: pt.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = { selectedSurvey: null };
  }

  setSelectedSurvey(survey) {
    this.setState({ selectedSurvey: survey || null });
  }

  showDefaults() {
    this.setState({ selectedSurvey: null });
  }

  addSurvey(event) {
    event.preventDefault();
    this.props.fields.surveys.addField();
  }

  deleteSurvey(event) {
    const index = event.currentTarget.dataset.surveyIndex;

    event.stopPropagation();
    this.props.fields.surveys.removeField(index);
    this.setSelectedSurvey();
  }

  render() {
    const { fields } = this.props;
    const { selectedSurvey } = this.state;
    return (
      <div className="row">
        <p className="help row">
          This action can show a single survey, or choose a single survey from
          multiple weighted ones.
        </p>
        <div className="fluid-4">
          <FormField type="text" label="Survey ID" field={fields.surveyId} />
          <div className="row array-field">
            <h4>Surveys</h4>
            <a className="button add-field" onClick={::this.addSurvey}>
              <i className="fa fa-plus"></i> Add Survey
            </a>

            {fields.surveys.length ?
              <ul>
                {
                  fields.surveys.map((survey, index) =>
                    <SurveyListItem
                      key={index}
                      survey={survey}
                      surveyIndex={index}
                      isSelected={_.isEqual(survey, selectedSurvey)}
                      hasErrors={_.some(survey, field => field.invalid)}
                      onClick={() => ::this.setSelectedSurvey(survey)}
                      deleteSurvey={::this.deleteSurvey}
                    />
                  )
                }
              </ul> : ' - No surveys'
            }
          </div>
        </div>
        <div className="fluid-4 float-right">
          <SurveyForm
            selectedSurvey={selectedSurvey}
            fields={fields}
            showDefaults={::this.showDefaults}
          />
        </div>
      </div>
    );
  }
}

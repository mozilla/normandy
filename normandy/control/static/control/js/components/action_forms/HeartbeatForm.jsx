import React from 'react'
import { reduxForm } from 'redux-form'
import classNames from 'classnames'
import { _ } from 'underscore'
import FormField from '../form_fields/FormFieldWrapper.jsx';

export const HeartbeatFormFields = [
  'surveyId',
  'defaults.message', 'defaults.engagementButtonLabel', 'defaults.thanksMessage',
  'defaults.postAnswerUrl', 'defaults.learnMoreMessage', 'defaults.learnMoreUrl',
  'surveys[].title', 'surveys[].message', 'surveys[].engagementButtonLabel', 'surveys[].thanksMessage',
  'surveys[].postAnswerUrl','surveys[].learnMoreMessage', 'surveys[].learnMoreUrl', 'surveys[].weight'
];

const formatLabel = (labelName) => labelName.replace( /([A-Z])/g, " $1" ).toLowerCase();

const SurveyListItem = (props) => {
  const { survey, surveyIndex, isSelected, deleteSurvey, onClick } = props;
  return (
    <li className={classNames({'active': isSelected})} onClick={onClick}>
      { survey.title.value || "Untitled Survey" }
      <span title="Delete this survey" className="delete-field" data-survey-index={surveyIndex} onClick={deleteSurvey}>
        <i className="fa fa-times red"></i>
      </span>
    </li>
  )
}

const SurveyForm = (props) => {
  const { selectedSurvey, fields, showDefaults } = props;
  const surveyObject = selectedSurvey || fields.defaults;
  let headerText = 'Default Survey Values';
  let containerClasses = classNames('fluid-8', {
    'active': selectedSurvey
  });

  if (selectedSurvey) {
    headerText = selectedSurvey.title.initialValue || 'New survey';
  }

  return (
    <div id='survey-form' className={containerClasses}>
      { selectedSurvey &&
        <span className="return-to-defaults" onClick={showDefaults}>
          <i className="fa fa-long-arrow-left pre"></i> Return to defaults
        </span>
      }
      <h4>{headerText}</h4>
      {
        Object.keys(surveyObject).map(fieldName =>
          <FormField key={fieldName} label={formatLabel(fieldName)} type="text" field={surveyObject[fieldName]} />
        )
      }
    </div>
  )
}

class HeartbeatForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = { selectedSurvey: null }
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
    let index = event.currentTarget.dataset.surveyIndex;

    event.stopPropagation();
    this.props.fields.surveys.removeField(index);
    this.setSelectedSurvey();
  }

  render() {
    const { fields } = this.props;
    const { selectedSurvey } = this.state;
    return (
      <div className="row">
        <p className="help row">This action can show a single survey, or choose a single survey from multiple weighted ones.</p>
        <div className="fluid-4">
          <FormField type="text" label="Survey ID" field={fields.surveyId} />
          <div className="row array-field">
            <h4>Surveys</h4>
            <a className="button add-field" onClick={::this.addSurvey}><i className="fa fa-plus"></i> Add Survey</a>

            { fields.surveys.length ?
              <ul>
                {
                  fields.surveys.map((survey, index) =>
                    <SurveyListItem
                      key={index}
                      survey={survey}
                      surveyIndex={index}
                      isSelected={_.isEqual(survey, selectedSurvey)}
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
          <SurveyForm selectedSurvey={selectedSurvey} fields={fields} showDefaults={::this.showDefaults} />
        </div>
      </div>
    )
  }
}

export default HeartbeatForm;

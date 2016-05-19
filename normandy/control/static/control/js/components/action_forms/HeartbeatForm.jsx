import React from 'react'
import { reduxForm } from 'redux-form'
import { _ } from 'underscore'


class SurveyForm extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { selectedSurvey, fields, setSelectedSurvey } = this.props;
    const surveyObject = selectedSurvey || fields['defaults'];
    let headerText = "Default Survey Values";
    let containerClass = 'row survey-form';
    if (selectedSurvey) {
      headerText = selectedSurvey.title.initialValue || "New survey"
      containerClass += ' active';
    }

    return (
      <div className={containerClass}>
        { selectedSurvey ?
          <span className="return-to-defaults" onClick={(e) => {
            setSelectedSurvey()
          }}>
            <i className="fa fa-long-arrow-left pre"></i> Return to defaults
          </span> : null
        }
        <h4>{headerText}</h4>
        {
          Object.keys(surveyObject).map(fieldName => {
            return (
              <div key={fieldName} className="row">
                <div className="fluid-8">
                  <label>{fieldName}</label>
                  <input type="text" field={surveyObject[fieldName]} {...surveyObject[fieldName]} />
                 </div>
              </div>
            )
          })
        }
      </div>
    )
  }
}

class HeartbeatForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = { selectedSurvey: null }
    this.setSelectedSurvey = this.setSelectedSurvey.bind(this);
  }

  setSelectedSurvey(survey) {
    this.setState({ selectedSurvey: survey || null });
  }

  render() {
    const { fields, setSelectedSurvey } = this.props;
    const { selectedSurvey } = this.state;
    return (
      <div className="row">
        <div className="fluid-4">
          <div className="row">
            <label>Survey ID</label>
            <input type="text" field={fields['surveyId']} {...fields['surveyId']} />
          </div>
          <div className="row array-field">
            <h4>Surveys</h4>

            <a className="button" onClick={(e) => {
              e.preventDefault();
              fields['surveys'].addField();
            }}><i className="fa fa-plus"></i> Add Survey</a>

            { fields['surveys'].length ?
              <ul>
                {
                  fields['surveys'].map((childField, index) => {
                    return (
                      <li key={index} className={_.isEqual(childField, selectedSurvey) ? 'active' : ''} onClick={(e) => {
                        this.setSelectedSurvey(childField)
                      }}>
                        { childField.title.value || "Untitled Survey" }
                        <span title="Delete this survey" onClick={(e) => {
                          e.stopPropagation();
                          fields['surveys'].removeField();
                          this.setSelectedSurvey();
                        }}><i className="fa fa-times red"></i></span>
                      </li>
                    )
                  })
                }
              </ul> : 'No surveys' }
          </div>
        </div>
        <div className="fluid-4 float-right">
          <SurveyForm selectedSurvey={selectedSurvey} fields={fields} setSelectedSurvey={this.setSelectedSurvey} />
        </div>
      </div>
    )
  }
}

export default HeartbeatForm;

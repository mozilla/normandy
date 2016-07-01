import React from 'react'
import { reduxForm } from 'redux-form'
import classNames from 'classnames'
import { _ } from 'underscore'
import FormField from '../form_fields/FormFieldWrapper.jsx';

export const FeatureRecommendationFormFields = ['domain',
              'recommendations[].name', 'recommendations[].id',
              'recommendations[].description', 'recommendations[].packageURL',
              'recommendations[].imageURL', 'recommendations[].infoURL'];

const formatLabel = (labelName) =>
  labelName.replace( /([A-Z])/g, " $1" ).toLowerCase();

const RecListItem = (props) => {
  const { recommendation, recIndex, isSelected, deleteRec, onClick } = props;
  return (
    <li className={classNames({'active': isSelected})} onClick={onClick}>
      { recommendation.name.value || "New Recommendation" }
      <span title="Delete this recommendation" className="delete-field"
            data-rec-index={recIndex} onClick={deleteRec}>
        <i className="fa fa-times red"></i>
      </span>
    </li>
  )
}

const RecForm = (props) => {
  const { selectedRec, fields } = props;
  const recObject = selectedRec;
  let headerText = selectedRec.name.value || 'New recommendation';
  let containerClasses = classNames('fluid-8', {
    'active': selectedRec
  });

  return (
    <div id='rec-form' className={containerClasses}>
      <h4>{headerText}</h4>
      {
        Object.keys(recObject).map(fieldName =>
          <FormField key={fieldName} label={formatLabel(fieldName)} type="text"
                     field={recObject[fieldName]} />
        )
      }
    </div>
  )
}

class FeatureRecommendationForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = { selectedRec: null }
  }

  setSelectedRec(rec) {
    this.setState({ selectedRec: rec || null });
  }

  addRec(event) {
    event.preventDefault();
    this.props.fields.recommendations.addField();
  }

  deleteRec(index) {
    this.props.fields.recommendations.removeField(index);
    this.setSelectedRec();
  }

  render() {
    const { fields } = this.props;
    const { selectedRec } = this.state;
    return (
      <div className="row">
        <p className="help row">This action can recommend one or more add-ons
                                to a user at a taret domain.</p>
        <div className="fluid-4">
          <FormField type="text" label="Target Domain" field={fields.domain} />
          <div className="row array-field">
            <h4>Recommended Add-ons</h4>
            <a className="button add-field" onClick={::this.addRec}>
              <i className="fa fa-plus"></i> Add Recommendation
            </a>

            { fields.recommendations.length ?
              <ul>
                {
                  fields.recommendations.map((recommendation, index) =>
                    <RecListItem
                      key={index}
                      recommendation={recommendation}
                      recIndex={index}
                      isSelected={_.isEqual(recommendation, selectedRec)}
                      onClick={() => ::this.setSelectedRec(recommendation)}
                      deleteRec={() => ::this.deleteRec(index)}
                    />
                  )
                }
              </ul> : ' - No recommendations'
            }
          </div>
        </div>
        <div className="fluid-4 float-right">
          {selectedRec && <RecForm selectedRec={selectedRec} fields={fields} />}
        </div>
      </div>
    )
  }
}

export default FeatureRecommendationForm;

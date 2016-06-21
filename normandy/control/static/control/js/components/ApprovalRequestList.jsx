import React from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import composeApprovalRequestContainer from './ApprovalRequestContainer.jsx'
import ControlActions from '../actions/ControlActions.js'

class ApprovalRequestDataRow extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { approvalRequest, dispatch } = this.props;

    return (
      <tr key={approvalRequest.id} onClick={(e) => {
        dispatch(push(`/control/recipe/${approvalRequest.recipe_id}/requests/${approvalRequest.id}/`))
      }}>
        <td>#{approvalRequest.id}</td>
        <td>{moment(approvalRequest.created).format('MMM Do YYYY')}</td>
        <td>{approvalRequest.creator.username}</td>
        <td>
          {
            approvalRequest.active ?
              'Open' : approvalRequest.is_approved ?
                'Approved' : 'Closed'
          }
        </td>
      </tr>
    )
  }
}


class ApprovalRequestList extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    const { dispatch } = this.props;
    dispatch(ControlActions.makeApiRequest('fetchAllApprovalRequests', {recipeId: this.props.recipeId}));
    dispatch(ControlActions.setSelectedApprovalRequest(null));
  }

  render() {
    return (
      <div className="fluid-8">
        <table id="recipe-list">
          <thead>
            <tr>
              <td>ID</td>
              <td>Date</td>
              <td>Created by</td>
              <td>Status</td>
            </tr>
          </thead>
          <tbody>
            {
              this.props.approvalRequests.map(approvalRequest => {
                return (<ApprovalRequestDataRow approvalRequest={approvalRequest} dispatch={this.props.dispatch} key={approvalRequest.id} />)
              })
            }
          </tbody>
        </table>
      </div>
    )
  }
}

let mapStateToProps = (state, ownProps) => ({
  approvalRequests: state.controlApp.approvalRequests || [],
  dispatch: ownProps.dispatch
});

export default composeApprovalRequestContainer(connect(
  mapStateToProps
)(ApprovalRequestList))

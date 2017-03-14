import React, {
  PropTypes as pt,
} from 'react';
import { Link } from 'react-router';
import cx from 'classnames';

import DropdownMenu from 'control/components/DropdownMenu';

export const FormButton = ({
  className,
  label,
  element = 'button',
  type = 'button',
  onClick,
  display,
  ...props,
}) => {
  if (display === false) {
    return null;
  }

  // need titlecase for JSX
  const Element = element;
  return (
    <Element
      className={cx('button', className)}
      onClick={onClick}
      children={label}
      type={type}
      key={label + className}
      {...props}
    />
  );
};

FormButton.propTypes = {
  display: pt.bool.isRequired,
  className: pt.string,
  label: pt.string,
  element: pt.any,
  type: pt.string,
  onClick: pt.func,
};


export default class RecipeFormActions extends React.Component {
  static propTypes = {
    onAction: pt.func.isRequired,
    isApproved: pt.bool,
    isEnabled: pt.bool,
    isUserViewingOutdated: pt.bool,
    isViewingLatestApproved: pt.bool,
    isPendingApproval: pt.bool,
    isUserRequester: pt.bool,
    isAlreadySaved: pt.bool,
    isFormPristine: pt.bool,
    isCloning: pt.bool,
    isFormDisabled: pt.bool,
    isAccepted: pt.bool,
    isRejected: pt.bool,
    hasApprovalRequest: pt.bool,
    recipeId: pt.number,
  };

  constructor(props) {
    super(props);
    this.state = {
      comment: {},
    };
  }

  onCommentChange(type) {
    return evt => {
      this.setState({
        comment: {
          ...this.state.comment,
          [type]: evt.target.value,
        },
      });
    };
  }

  getActions({
    isApproved,
    isEnabled,
    isUserViewingOutdated,
    isViewingLatestApproved,
    isPendingApproval,
    isUserRequester,
    isAlreadySaved,
    isFormPristine,
    isCloning,
    isFormDisabled,
    hasApprovalRequest,
    recipeId,
  }) {
    return [
      // delete
      <FormButton
        display={isAlreadySaved && !isCloning}
        disabled={isFormDisabled}
        className="action-delete delete"
        label="Delete"
        element={Link}
        to={`/control/recipe/${recipeId}/delete/`}
      />,
      // save
      <FormButton
        disabled={isFormPristine}
        display={isAlreadySaved && !isCloning}
        className="action-save submit"
        type="submit"
        label="Save Draft"
      />,
      // new
      <FormButton
        disabled={isFormPristine}
        display={!isAlreadySaved || isCloning}
        className="action-new submit"
        type="submit"
        label="Save New Recipe"
      />,
      // enable
      <FormButton
        display={isViewingLatestApproved && !isEnabled}
        disabled={!isApproved}
        className="action-enable submit"
        label="Enable"
        element={isApproved ? Link : 'button'}
        to={`/control/recipe/${recipeId}/enable/`}
      />,
      // disable
      <FormButton
        display={!isUserViewingOutdated && isEnabled}
        className="action-disable submit delete"
        label="Disable"
        element={Link}
        to={`/control/recipe/${recipeId}/disable/`}
      />,
      // cancel
      <FormButton
        display={!isUserViewingOutdated && isPendingApproval}
        className="action-cancel submit delete"
        onClick={this.createActionEmitter('cancel')}
        label="Cancel Review"
      />,
      // approve
      <DropdownMenu
        display={!isUserViewingOutdated && isPendingApproval && !isCloning}
        pinTop
        pinRight
        useClick
        trigger={
          <FormButton
            disabled={isUserRequester}
            className="action-approve submit"
            label="Approve"
          />
        }
      >
        <div>
          Add a review comment
          <textarea
            defaultValue={this.state.comment.approve}
            onChange={this.onCommentChange('approve')}
          />
          <FormButton
            className="mini-button"
            type="button"
            onClick={() => {
              this.props.onAction('approve', {
                comment: this.state.comment.approve,
              });
            }}
            disabled={!this.state.comment.approve}
          >
            Approve
          </FormButton>
        </div>
      </DropdownMenu>,
      // reject
      <DropdownMenu
        display={!isUserViewingOutdated && isPendingApproval && !isCloning}
        pinTop
        pinRight
        useClick
        trigger={
          <FormButton
            disabled={isUserRequester}
            className="action-reject submit delete"
            label="Reject"
          />
        }
      >
        <div>
          Add a review comment
          <textarea
            defaultValue={this.state.comment.reject}
            onChange={this.onCommentChange('reject')}
          />
          <FormButton
            className="mini-button"
            type="button"
            onClick={() => {
              this.props.onAction('reject', {
                comment: this.state.comment.reject,
              });
            }}
            disabled={!this.state.comment.reject}
          >
            Reject
          </FormButton>
        </div>
      </DropdownMenu>,
      // request
      <FormButton
        display={!isUserViewingOutdated && !hasApprovalRequest
          && !isPendingApproval && isAlreadySaved && !isCloning}
        disabled={!isFormPristine}
        className="action-request submit"
        onClick={this.createActionEmitter('request')}
        label="Request Approval"
      />,
    ];
  }

  createActionEmitter(type) {
    this.actionCache = this.actionCache || {};

    if (!this.actionCache[type]) {
      this.actionCache[type] = () => {
        this.props.onAction(type);
      };
    }

    return this.actionCache[type];
  }

  /**
   * Render
   */
  render() {
    return (
      <div className="form-actions">
        {this.getActions(this.props).map((Action, idx) =>
          // Need to key the action buttons to satisfy a React warning
          React.cloneElement(Action, { key: idx })
        )}
      </div>
    );
  }
}

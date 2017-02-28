import React, {
  PropTypes as pt,
} from 'react';
import { Link } from 'react-router';
import cx from 'classnames';

export const FormButton = ({
    className,
    label,
    element = 'button',
    type = 'button',
    onClick,
    display,
    ...props,
  }) => {
  if (!display) {
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
    isUserViewingOutdated: pt.bool,
    isPendingApproval: pt.bool,
    isUserRequestor: pt.bool,
    isAlreadySaved: pt.bool,
    isFormPristine: pt.bool,
    isCloning: pt.bool,
    isFormDisabled: pt.bool,
    isAccepted: pt.bool,
    isRejected: pt.bool,
    hasApprovalRequest: pt.bool,
    recipeId: pt.number,
  };

  getActions({
    isUserViewingOutdated,
    isPendingApproval,
    isUserRequestor,
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
      // cancel
      <FormButton
        display={!isUserViewingOutdated && isPendingApproval}
        className="action-cancel submit delete"
        onClick={this.createActionEmitter('cancel')}
        label="Cancel Review Request"
      />,
      // approve
      <FormButton
        display={!isUserViewingOutdated && isPendingApproval && !isCloning}
        disabled={isUserRequestor}
        className="action-approve submit"
        onClick={this.createActionEmitter('approve')}
        label="Approve"
      />,
      // reject
      <FormButton
        display={!isUserViewingOutdated && isPendingApproval && !isCloning}
        disabled={isUserRequestor}
        className="action-reject submit delete"
        onClick={this.createActionEmitter('reject')}
        label="Reject"
      />,
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

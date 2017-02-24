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
    recipeId,
  }) {
    return [
      // revert
      <FormButton
        display={isUserViewingOutdated && isFormPristine}
        disabled={isFormDisabled}
        className={'submit'}
        type={'submit'}
        label={'Revert to this Revision'}
      />,
      // cancel
      <FormButton
        display={!isUserViewingOutdated && isPendingApproval && isUserRequestor}
        className={'submit delete'}
        onClick={this.createActionEmitter('close')}
        label={'Cancel Review Request'}
      />,
      // back to latest
      <FormButton
        display={isUserViewingOutdated && !isCloning}
        element={Link}
        to={`/control/recipe/${recipeId}/`}
        label={`Back to ${isPendingApproval ? 'Review' : 'Latest'}`}
      />,
      // approve
      <FormButton
        display={!isUserViewingOutdated && isPendingApproval && !isCloning && !isUserRequestor}
        className={'submit'}
        onClick={this.createActionEmitter('approve')}
        label={'Approve'}
      />,
      // reject
      <FormButton
        display={!isUserViewingOutdated && isPendingApproval && !isCloning && !isUserRequestor}
        className={'submit delete'}
        onClick={this.createActionEmitter('reject')}
        label={'Reject'}
      />,
      // delete
      <FormButton
        display={!isUserViewingOutdated && !isPendingApproval && isAlreadySaved && !isCloning}
        className={'delete'}
        label={'Delete'}
        element={Link}
        to={`/control/recipe/${recipeId}/delete/`}
      />,
      // request
      <FormButton
        display={!isUserViewingOutdated && !isPendingApproval && isAlreadySaved
          && !isCloning && isFormPristine}
        className={'submit'}
        onClick={this.createActionEmitter('request')}
        label={'Request Approval'}
      />,
      // save
      <FormButton
        display={!isPendingApproval && isAlreadySaved && !isCloning && !isFormPristine
          && !isUserViewingOutdated}
        className={'submit'}
        type={'submit'}
        label={'Save New Draft'}
      />,
      // new
      <FormButton
        display={(!isCloning && !isPendingApproval && !isAlreadySaved)
          || (isUserViewingOutdated && !isFormPristine)}
        className={'submit'}
        type={'submit'}
        label={'Save New Draft'}
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
        {this.getActions(this.props)}
      </div>
    );
  }
}

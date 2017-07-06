import pt from 'prop-types';
import React from 'react';


/**
 * Container for buttons displayed at the bottom of a form.
 *
 * Example:
 *
 * <FormActions>
 *   <FormActions.Primary>
 *     <Button>Save</Button>
 *   </FormActions.Primary>
 *   <FormActions.Secondary>
 *     <Button>Delete</Button>
 *   </FormActions.Secondary>
 * </FormActions>
 */
export default function FormActions({ children }) {
  return (
    <div className="form-actions">
      {children}
    </div>
  );
}
FormActions.propTypes = {
  children: pt.node,
};
FormActions.defaultProps = {
  children: null,
};

/**
 * Container for the primary actions (floated to the right).
 */
FormActions.Primary = function FormActionsPrimary({ children }) {
  return (
    <div className="primary">{children}</div>
  );
};
FormActions.Primary.propTypes = {
  children: pt.node,
};
FormActions.Primary.defaultProps = {
  children: null,
};

/**
 * Container for the secondary actions (floated to the left).
 */
FormActions.Secondary = function FormActionsSecondary({ children }) {
  return (
    <div className="secondary">{children}</div>
  );
};
FormActions.Secondary.propTypes = {
  children: pt.node,
};
FormActions.Secondary.defaultProps = {
  children: null,
};

import PropTypes from 'prop-types';
import React from 'react';

import { SimpleLoadingOverlay } from 'control_new/components/common/LoadingOverlay';


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
export default function FormActions({ children, isLoading }) {
  return (
    <div className="form-actions">
      <SimpleLoadingOverlay isVisible={isLoading}>
        {children}
      </SimpleLoadingOverlay>
    </div>
  );
}
FormActions.propTypes = {
  children: PropTypes.node,
  isLoading: PropTypes.bool,
};
FormActions.defaultProps = {
  children: null,
  isLoading: false,
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
  children: PropTypes.node,
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
  children: PropTypes.node,
};
FormActions.Secondary.defaultProps = {
  children: null,
};

import PropTypes from 'prop-types';
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
export default class FormActions extends React.PureComponent {
  /**
   * Container for the primary actions (floated to the right).
   */
  static Primary = class Primary extends React.PureComponent {
    static propTypes = {
      children: PropTypes.node,
    };

    static defaultProps = {
      children: null,
    };

    render() {
      const { children } = this.props;
      return <div className="primary">{children}</div>;
    }
  }

  /**
   * Container for the secondary actions (floated to the left).
   */
  static Secondary = class Secondary extends React.PureComponent {
    static propTypes = {
      children: PropTypes.node,
    };

    static defaultProps = {
      children: null,
    };

    render() {
      const { children } = this.props;
      return <div className="secondary">{children}</div>;
    }
  }

  static propTypes = {
    children: PropTypes.node,
  };

  static defaultProps = {
    children: null,
  };

  render() {
    const { children } = this.props;

    return (
      <div className="form-actions">
        {children}
      </div>
    );
  }
}

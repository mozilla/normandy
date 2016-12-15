import React, { PropTypes as pt } from 'react';
import uuid from 'node-uuid';

import closest from 'client/utils/closest';

/**
 * Simple component used to hide/show a block of content
 * based on focus/clicking. Uses a `trigger` property
 * to determine the element which should be used to
 * trigger the menu's appearance
 */

export default class DropdownMenu extends React.Component {
  static propTypes = {
    // trigger is the element the user interacts with
    // to display the dropdown menu
    trigger: pt.node.isRequired,
    // children is the content displayed when open
    children: pt.any.isRequired,
    // track clicks to display menu?
    useClick: pt.bool,
    // track trigger's focus to display menu?
    useFocus: pt.bool,
    // pin the dropdown to the right edge
    // of the parent container?
    pinRight: pt.bool,
  };

  constructor(props) {
    super(props);

    // hidden by default
    this.state = {
      isVisible: false,
    };

    this.toggleVisibility = ::this.toggleVisibility;
    this.onMenuBlur = ::this.onMenuBlur;
  }

  /**
   * On mount, generates a new component ID
   * if one does not already exist.
   *
   * (This prevents components interfering,
   * due to how the component uses class selectors)
   *
   * @return {void}
   */
  componentDidMount() {
    this.id = this.id || `dropdown-menu-${uuid()}`;
  }

  /**
   * On unmount, hides the modal (if visible)
   * and removes all relevant bindings.
   *
   * @return {void}
   */
  componentWillUnmount() {
    // just toggle it to hide when component unmounts
    // (this will automatically remove event bindings etc too)
    this.toggleVisibility(false);
  }

  /**
   * Click handler to determine if user clicked inside the menu.
   * If the user clicked OUTSIDE of the menu, it is closed.
   *
   * @param  {MouseEvent} evt Original click event
   * @return {void}
   */
  onMenuBlur(evt) {
    // determine if the click was inside of this .dropdown-menu
    if (!closest(evt.target, `.${this.id}`)) {
      // and if so, close it
      this.toggleVisibility(false);
    }
  }

  /**
   * Adds or removes click event handler on the body
   * (used to close menu if user clicks out of menu)
   * based on the `shouldBind` param.
   *
   * @param  {boolean} shouldBind Should the event be attached?
   * @return {void}
   */
  updateWindowBinding(shouldBind) {
    if (shouldBind) {
      document.body.addEventListener('click', this.onMenuBlur, true);
    } else {
      document.body.removeEventListener('click', this.onMenuBlur);
    }
  }

  /**
   * Shows or hides the menu based on previous state
   * or if the `force` param is passed.
   * @param  {Boolean} force (Optional) Value to set visibility
   * @return {void}
   */
  toggleVisibility(force) {
    // if we get a parameter, use that instead of just straight up toggling
    const newVisibleState = typeof force === 'boolean' ? force : !this.state.isVisible;

    this.setState({
      isVisible: newVisibleState,
    });

    // add or remove the event based on visibility
    this.updateWindowBinding(newVisibleState);
  }

  /**
   * Render
   */
  render() {
    const pinClass = this.props.pinRight && 'pin-right';
    return (
      <div
        className={`dropdown-menu ${this.id}`}
      >
        <div
          className="dropdown-trigger"
          onClick={this.props.useClick && this.toggleVisibility}
          onFocus={this.props.useFocus && this.toggleVisibility}
        >
          { this.props.trigger }
        </div>
        {
          this.state.isVisible &&
            <div
              className={`dropdown-content ${pinClass || ''}`}
            >
              { this.props.children }
            </div>
        }
      </div>
    );
  }
}

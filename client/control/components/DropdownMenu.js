import React, { PropTypes as pt } from 'react';
import uuid from 'node-uuid';

import closest from 'client/utils/closest';

/**
 * Simple component used to hide/show a block of content
 * based on focus/clicking. Uses a `trigger` property
 * to determine the element which should be used to
 * trigger the menu's appearance
 *
 * @prop {node} trigger
 *   Element the user interacts with to display the menu
 * @prop {node} children
 *   Element(s) displayed in the content section when open
 * @prop {boolean} useClick (Optional)
 *   Track clicks on the display menu?
 * @prop {boolean} useFocus (Optional)
 *   Track focus state on trigger element to display the menu?
 * @prop {boolean} pinRight (Optional)
 *   Should the dropdown be pinned to the right edge?
 */
export default class DropdownMenu extends React.Component {
  static propTypes = {
    trigger: pt.node.isRequired,
    children: pt.node.isRequired,
    disabled: pt.bool,
    useClick: pt.bool,
    useFocus: pt.bool,
    pinRight: pt.bool,
  };

  constructor(props) {
    super(props);

    // hidden by default
    this.state = {
      isVisible: false,
    };

    this.toggleVisibility = ::this.toggleVisibility;
    this.enableVisibility = ::this.enableVisibility;
    this.disableVisibility = ::this.disableVisibility;
    this.onMenuBlur = ::this.onMenuBlur;
  }

  /**
   * On mount, generates a new component ID
   * if one does not already exist.
   *
   * (This prevents components interfering,
   * due to how the component uses class selectors)
   *
   */
  componentDidMount() {
    this.id = this.id || `dropdown-menu-${uuid()}`;

    // Track mounted state, since the `blur` target handler
    // can sometimes fire after the element has been removed
    this.mounted = true;
  }

  /**
   * On unmount, hides the modal (if visible)
   * and removes all relevant bindings.
   *
   */
  componentWillUnmount() {
    // just toggle it to hide when component unmounts
    // (this will automatically remove event bindings etc too)
    this.toggleVisibility(false);

    // update the 'mounted' flag
    this.mounted = false;
  }

  /**
   * Click handler to determine if user clicked inside the menu.
   * If the user clicked OUTSIDE of the menu, it is closed.
   *
   * @param  {MouseEvent} evt Original click event
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
   */
  updateWindowBinding(shouldBind) {
    if (shouldBind) {
      document.body.addEventListener('click', this.onMenuBlur, true);
    } else {
      document.body.removeEventListener('click', this.onMenuBlur);
    }
  }

  enableVisibility() {
    return this.toggleVisibility(true);
  }

  disableVisibility() {
    return this.toggleVisibility(false);
  }

  /**
   * Shows or hides the menu based on previous state
   * or if the `force` param is passed.
   * @param  {Boolean} force (Optional) Value to set visibility
   */
  toggleVisibility(force) {
    // by default we toggle the state
    let newVisibleState = !this.state.isVisible;

    // check if we are forcing the state
    if (typeof force === 'boolean') {
      newVisibleState = force;
    }

    // this event can fire sometimes when the target has already left the page
    // so we track if the component is still mounted or not to update state
    if (this.mounted) {
      this.setState({
        isVisible: newVisibleState,
      });
    }

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
          onClick={this.props.useClick && this.enableVisibility}

          onFocus={this.props.useFocus && this.enableVisibility}
          onChange={this.props.useFocus && this.enableVisibility}
          onKeyDown={this.props.useFocus && this.enableVisibility}
        >
          { this.props.trigger }
        </div>
        {
          !this.props.disabled &&
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

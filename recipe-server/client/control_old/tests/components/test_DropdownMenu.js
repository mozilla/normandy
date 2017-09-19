/* eslint-disable react/prop-types */
import React from 'react';
import { mount } from 'enzyme';

import DropdownMenu from 'control_old/components/DropdownMenu';

const propFactory = props => ({
  trigger: <div id="trigger">Trigger!</div>,
  children: <div id="test">Child!</div>,
  disabled: false,
  useClick: true,
  useFocus: true,
  pinRight: false,
  ...props,
});

describe('<DropdownMenu>', () => {
  it('should work', () => {
    const wrapper = () => mount(<DropdownMenu
      {...propFactory()}
    />);
    expect(wrapper).not.toThrow();
  });

  describe('useClick', () => {
    it('should display the children when clicked', () => {
      const wrapper = mount(<DropdownMenu
        {...propFactory({ useClick: true })}
      />);
      // should not be shown to start
      expect(wrapper.find('#test').length).toBe(0);
      // click the trigger
      wrapper.find('#trigger').simulate('click');
      // children should now appear
      expect(wrapper.find('#test').length).toBe(1);
      expect(wrapper.find('.dropdown-content').length).toBe(1);
    });

    it('should NOT display if useClick is false and user clicks the trigger', () => {
      const wrapper = mount(<DropdownMenu
        {...propFactory({ useClick: false })}
      />);
      // should not be shown to start
      expect(wrapper.find('#test').length).toBe(0);
      // click the trigger
      wrapper.find('#trigger').simulate('click');
      // children should still not appear
      expect(wrapper.find('#test').length).toBe(0);
    });

    it('should NOT display if disabled, regardless of useClick', () => {
      const wrapper = mount(<DropdownMenu
        {...propFactory({
          useClick: false,
          disabled: true,
        })}
      />);
      // should not be shown to start
      expect(wrapper.find('#test').length).toBe(0);
      // click the trigger
      wrapper.find('#trigger').simulate('click');
      // children should still not appear
      expect(wrapper.find('#test').length).toBe(0);

      // --

      const wrapperWithClick = mount(<DropdownMenu
        {...propFactory({
          useClick: true,
          disabled: true,
        })}
      />);
      // should not be shown to start
      expect(wrapperWithClick.find('#test').length).toBe(0);
      // click the trigger
      wrapperWithClick.find('#trigger').simulate('click');
      // children should still not appear
      expect(wrapperWithClick.find('#test').length).toBe(0);
    });
  });

  describe('useFocus', () => {
    it('should display the children when focused', () => {
      const wrapper = mount(<DropdownMenu
        {...propFactory({
          trigger: <input type="text" id="trigger" />,
          useFocus: true,
        })}
      />);
      // should not be shown to start
      expect(wrapper.find('#test').length).toBe(0);
      // focus the trigger
      wrapper.find('#trigger').simulate('focus');
      // children should now appear
      expect(wrapper.find('#test').length).toBe(1);
    });

    it('should NOT display if useFocus is false and user focuses the trigger', () => {
      const wrapper = mount(<DropdownMenu
        {...propFactory({
          trigger: <input type="text" id="trigger" />,
          useFocus: false,
        })}
      />);
      // should not be shown to start
      expect(wrapper.find('#test').length).toBe(0);
      // focus the trigger
      wrapper.find('#trigger').simulate('focus');
      // children should still not appear
      expect(wrapper.find('#test').length).toBe(0);
    });

    it('should NOT display if disabled, regardless of useFocus', () => {
      const wrapper = mount(<DropdownMenu
        {...propFactory({
          trigger: <input type="text" id="trigger" />,
          useFocus: false,
          disabled: true,
        })}
      />);
      // should not be shown to start
      expect(wrapper.find('#test').length).toBe(0);
      // focus the trigger
      wrapper.find('#trigger').simulate('focus');
      // children should still not appear
      expect(wrapper.find('#test').length).toBe(0);

      // --

      const wrapperWithFocus = mount(<DropdownMenu
        {...propFactory({
          trigger: <input type="text" id="trigger" />,
          useFocus: true,
          disabled: true,
        })}
      />);
      // should not be shown to start
      expect(wrapperWithFocus.find('#test').length).toBe(0);
      // focus the trigger
      wrapperWithFocus.find('#trigger').simulate('focus');
      // children should still not appear
      expect(wrapperWithFocus.find('#test').length).toBe(0);
    });
  });

  describe('pinRight', () => {
    it('should add `.pin-right` to the content class when active', () => {
      const wrapper = mount(<DropdownMenu
        {...propFactory({
          pinRight: true,
        })}
      />);
      wrapper.find('#trigger').simulate('click');
      expect(wrapper.find('.dropdown-content.pin-right').length).toBe(1);
    });

    it('should NOT add `.pin-right` to content class when inactive', () => {
      const wrapper = mount(<DropdownMenu
        {...propFactory({
          pinRight: false,
        })}
      />);
      wrapper.find('#trigger').simulate('click');
      expect(wrapper.find('.dropdown-content.pin-right').length).toBe(0);
    });
  });

  it('should hide the menu when something else is clicked', () => {
    spyOn(document.body, 'addEventListener').and.callThrough();

    const wrapper = mount(
      <div>
        <DropdownMenu {...propFactory()} />
        <span id="outside" />
      </div>,
    { attachTo: document.body });

    wrapper.find('#trigger').simulate('click');
    expect(wrapper.find('.dropdown-content').length).toBe(1);

    // document.body should get an event handler attached
    expect(document.body.addEventListener).toHaveBeenCalled();

    // and firing that handler should close the menu
    // (have to do this weird synthetic click stuff since
    // document.body doesnt have a simulate event)
    const clickEvent = document.createEvent('HTMLEvents');
    clickEvent.initEvent('click', false, true);
    document.body.dispatchEvent(clickEvent);

    // dropdown content should be hidden now
    expect(wrapper.find('.dropdown-content').length).toBe(0);

    // cleanup the attachTo business
    wrapper.detach();
  });
});

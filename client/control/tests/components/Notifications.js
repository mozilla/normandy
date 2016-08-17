import React from 'react';
import { shallow } from 'enzyme';
import { Notifications, Notification } from '../../components/Notifications.js';

describe('Notification components', () => {
  describe('<Notifications>', () => {
    it('should render a <Notification> for each given notification', () => {
      const notification1 = { messageType: 'success', message: 'message', id: 1 };
      const notification2 = { messageType: 'success', message: 'message', id: 2 };
      const wrapper = shallow(<Notifications notifications={[notification1, notification2]} />);

      const notifications = wrapper.find(Notification);
      expect(notifications.length).toEqual(2);
      expect(notifications.get(0).props.notification).toEqual(notification1);
      expect(notifications.get(1).props.notification).toEqual(notification2);
    });
  });

  describe('<Notification>', () => {
    it('should render the notification message', () => {
      const notification1 = { messageType: 'success', message: 'message', id: 1 };
      const wrapper = shallow(<Notification notification={notification1} />);
      expect(wrapper.text()).toEqual(notification1.message);
    });
  });
});

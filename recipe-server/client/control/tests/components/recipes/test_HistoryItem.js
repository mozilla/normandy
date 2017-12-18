import { Timeline } from 'antd';
import { fromJS, Map } from 'immutable';
import React from 'react';
import { mount } from 'enzyme';

import { wrapMockStore } from 'control/tests/mockStore';

import TestComponent, {
  HistoryItemPopover,
  RevisionInfo,
  RequestInfo,
  ApprovalComment,
} from 'control/components/recipes/HistoryItem';

const { WrappedComponent: HistoryItem } = TestComponent;

describe('<HistoryItem>', () => {
  it('should work', () => {
    const props = {
      isLatestRevision: () => {},
      revision: new Map(),
      status: new Map(),
      selectedRevisionId: 'abc123',
      recipeId: 'def234',
      revisionNo: 6,
    };

    const wrapper = () => mount(wrapMockStore(<HistoryItem {...props} />));

    expect(wrapper).not.toThrow();
  });

  describe('selected revisions', () => {
    const props = {
      isLatestRevision: () => {},
      revision: new Map({
        id: 'abc123',
      }),
      status: new Map(),
      recipeId: 'def234',
      revisionNo: 6,
    };

    it('should highlight when it is the selected revision', () => {
      const wrapper = mount(wrapMockStore(<HistoryItem {...props} selectedRevisionId="abc123" />));

      // We can test against the Timeline.Item inheritting proper visual styles.
      const el = wrapper.find(Timeline.Item);
      expect(el.length).toBe(1);
      expect(el.props().color).toBe('blue');

      // `dot` is an Icon which should be highlighted with the appropriate icon.
      expect(el.props().dot).toBeTruthy();
      expect(el.props().dot.props.type).toBe('circle-left');
      expect(el.props().dot.props.color).toBe('blue');
    });

    it('should NOT highlight when it is NOT the selected revision', () => {
      const wrapper = mount(wrapMockStore(<HistoryItem {...props} selectedRevisionId="aeiou" />));

      const el = wrapper.find(Timeline.Item);
      expect(el.length).toBe(1);
      expect(el.props().color).not.toBe('blue');
      expect(el.props().dot).toBe(null);
    });
  });

  describe('<HistoryItemPopover>', () => {
    const props = {
      revision: new Map(),
    };

    it('should work', () => {
      const wrapper = () => mount(<HistoryItemPopover {...props} />);

      expect(wrapper).not.toThrow();
    });

    it('should show RevisionInfo by default', () => {
      const wrapper = mount(<HistoryItemPopover {...props} />);

      // Determine that the RevisionInfo is rendering an element.
      expect(wrapper.find(RevisionInfo).length).toBe(1);
      expect(wrapper.find(RevisionInfo).children().length).not.toBe(0);

      // Confirm the others aren't rendering.
      expect(wrapper.find(RequestInfo).children().length).toBe(0);
      expect(wrapper.find(ApprovalComment).children().length).toBe(0);
    });

    it('should show RequestInfo if a request is open', () => {
      const revision = fromJS({ approval_request: {} });
      const wrapper = mount(<HistoryItemPopover revision={revision} />);

      expect(wrapper.find(RevisionInfo).children().length).not.toBe(0);
      expect(wrapper.find(RequestInfo).children().length).not.toBe(0);

      expect(wrapper.find(ApprovalComment).children().length).toBe(0);
    });

    it('should show an ApprovalComment if a request was responded to', () => {
      const revision = fromJS({ approval_request: { approved: true } });
      const wrapper = mount(<HistoryItemPopover revision={revision} />);

      expect(wrapper.find(RevisionInfo).children().length).not.toBe(0);
      expect(wrapper.find(RequestInfo).children().length).not.toBe(0);
      expect(wrapper.find(ApprovalComment).children().length).not.toBe(0);
    });
  });

  describe('<RevisionInfo>', () => {
    const props = {
      revision: new Map(),
    };

    it('should work', () => {
      const wrapper = () => mount(<RevisionInfo {...props} />);

      expect(wrapper).not.toThrow();
    });
  });

  describe('<RequestInfo>', () => {
    const props = {
      revision: new Map(),
    };

    it('should work', () => {
      const wrapper = () => mount(<RequestInfo {...props} />);

      expect(wrapper).not.toThrow();
    });
  });

  describe('<ApprovalComment>', () => {
    const props = {
      revision: new Map(),
    };

    it('should work', () => {
      const wrapper = () => mount(<ApprovalComment {...props} />);

      expect(wrapper).not.toThrow();
    });
  });
});


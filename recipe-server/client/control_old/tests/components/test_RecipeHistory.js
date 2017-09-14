import React from 'react';
import { shallow, mount } from 'enzyme';

import { HistoryItem, HistoryList } from 'control_old/components/RecipeHistory';
import DraftStatus, { STATUS_MESSAGES } from 'control_old/components/DraftStatus';
import DraftStatusIcon, { STATUS_ICONS } from 'control_old/components/DraftStatusIcon';

describe('Recipe history components', () => {
  describe('<HistoryList>', () => {
    it('should render a <HistoryItem> for each revision', () => {
      const recipe = { revision_id: 2 };
      const revision1 = { id: 1 };
      const revision2 = { id: 2 };
      const dispatch = () => null;
      const wrapper = shallow(
        <HistoryList dispatch={dispatch} recipe={recipe} revisions={[revision1, revision2]} />,
      );

      const items = wrapper.find(HistoryItem);
      expect(items.length).toEqual(2);
      expect(items.get(0).props.revision).toEqual(revision1);
      expect(items.get(1).props.revision).toEqual(revision2);
    });
  });

  describe('<HistoryItem>', () => {
    const dispatch = () => null;
    const recipe = {
      revision_id: 2,
      latest_revision_id: 2,
    };

    describe('rendering the revision info', () => {
      const revision = {
        id: 2,
        recipe,
        date_created: '2016-08-10T04:16:58.440Z+00:00',
        comment: 'test comment',
      };

      const wrapper = shallow(
        <HistoryItem revision={revision} recipe={recipe} dispatch={dispatch} />,
      );

      it('should render the revision number', () =>
        expect(wrapper.find('.revision-number').text()).toContain(revision.recipe.revision_id));

      it('should render the revision comment', () =>
        expect(wrapper.find('.comment-text').text()).toContain(revision.comment));

      it('should render a DraftStatus component', () =>
        expect(wrapper.find(DraftStatus).length).toBe(1));
    });
  });

  describe('<DraftStatus>', () => {
    const recipe = {
      revision_id: 2,
      latest_revision_id: 2,
      approval_request: null,
    };

    it('should render a `Draft` message', () => {
      const wrapper = mount(<DraftStatus recipe={recipe} />);
      expect(wrapper.find('.status-text').text()).toBe(STATUS_MESSAGES.draft);
    });

    it('should render a `Pending` message', () => {
      const wrapper = mount(<DraftStatus
        recipe={{
          ...recipe,
          approval_request: {},
        }}
      />);
      expect(wrapper.find('.status-text').text()).toBe(STATUS_MESSAGES.pending);
    });

    it('should render a `Rejected` message', () => {
      const wrapper = mount(<DraftStatus
        recipe={{
          ...recipe,
          approval_request: {
            approved: false,
          },
        }}
      />);
      expect(wrapper.find('.status-text').text()).toBe(STATUS_MESSAGES.rejected);
    });

    it('should render an `Approved` message', () => {
      const wrapper = mount(<DraftStatus
        recipe={{
          ...recipe,
          approval_request: {
            approved: true,
          },
        }}
      />);
      expect(wrapper.find('.status-text').text()).toBe(STATUS_MESSAGES.approved);
    });

    it('should render a `Latest Draft` message', () => {
      const wrapper = mount(<DraftStatus
        recipe={recipe}
        latestRevisionId={recipe.revision_id}
      />);
      expect(wrapper.find('.flavor-text').text()).toBe(STATUS_MESSAGES.latestDraft);
    });

    it('should render a `Last Approved Revision` message', () => {
      const wrapper = mount(<DraftStatus
        recipe={recipe}
        lastApprovedRevisionId={recipe.revision_id}
      />);
      expect(wrapper.find('.flavor-text').text()).toBe(STATUS_MESSAGES.latestApproved);
    });
  });

  describe('<DraftStatusIcon>', () => {
    it('should render a `Draft` icon', () => {
      const wrapper = shallow(<DraftStatusIcon request={null} />);
      expect(wrapper.find(`.draft-status-icon.${STATUS_ICONS.draft}`).length).toBe(1);
    });

    it('should render a `Pending` icon', () => {
      const wrapper = shallow(<DraftStatusIcon request={{ approved: null }} />);
      expect(wrapper.find(`.draft-status-icon.${STATUS_ICONS.pending}`).length).toBe(1);
    });

    it('should render a `Rejected` icon', () => {
      const wrapper = shallow(<DraftStatusIcon request={{ approved: false }} />);
      expect(wrapper.find(`.draft-status-icon.${STATUS_ICONS.rejected}`).length).toBe(1);
    });

    it('should render a `Approved` icon', () => {
      const wrapper = shallow(<DraftStatusIcon request={{ approved: true }} />);
      expect(wrapper.find(`.draft-status-icon.${STATUS_ICONS.approved}`).length).toBe(1);
    });
  });
});

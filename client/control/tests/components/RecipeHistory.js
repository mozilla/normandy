import React from 'react';
import { shallow } from 'enzyme';
import { HistoryItem, HistoryList } from '../../components/RecipeHistory.js';

describe('Recipe history components', () => {
  describe('<HistoryList>', () => {
    it('should render a <HistoryItem> for each revision', () => {
      const recipe = { revision_id: 2 };
      const revision1 = { id: 1 };
      const revision2 = { id: 2 };
      const dispatch = () => null;
      const wrapper = shallow(
        <HistoryList dispatch={dispatch} recipe={recipe} revisions={[revision1, revision2]} />
      );

      const items = wrapper.find(HistoryItem);
      expect(items.length).toEqual(2);
      expect(items.get(0).props.revision).toEqual(revision1);
      expect(items.get(1).props.revision).toEqual(revision2);
    });
  });

  describe('<HistoryItem>', () => {
    it('should render the revision info', () => {
      const dispatch = () => null;
      const recipe = { revision_id: 1 };
      const revision = {
        id: 2,
        recipe,
        date_created: '2016-08-10T04:16:58.440Z+00:00',
        comment: 'test comment',
      };

      const wrapper = shallow(
        <HistoryItem revision={revision} recipe={recipe} dispatch={dispatch} />
      );
      expect(wrapper.find('.revision-number').text()).toContain(revision.recipe.revision_id);
      expect(wrapper.find('.revision-comment').text()).toContain(revision.comment);
      expect(wrapper.find('.status-indicator').text()).toContain('Current Revision');
    });

    it('should not render the status indicator if the revision is not current', () => {
      const dispatch = () => null;
      const recipe = { revision_id: 2 };
      const revision = {
        id: 3,
        recipe: { revision_id: 1 },
        date_created: '2016-08-10T04:16:58.440Z+00:00',
        comment: 'test comment',
      };

      const wrapper = shallow(
        <HistoryItem revision={revision} recipe={recipe} dispatch={dispatch} />
      );
      expect(wrapper.find('.status-indicator').isEmpty()).toEqual(true);
    });
  });
});

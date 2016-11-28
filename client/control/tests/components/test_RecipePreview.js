import React from 'react';
import { mount } from 'enzyme';
import { UnwrappedRecipePreview } from 'control/components/RecipePreview.js';

describe('Recipe preview components', () => {
  describe('<UnwrappedRecipePreview>', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should not include a colon in the error when there is no port number', () => {
      const preview = mount(<UnwrappedRecipePreview recipe={{}} />);
      preview.instance().currentURL = () => new URL('http://example.com/control/');
      jasmine.clock().tick(1000);
      const errorHelp = preview.find('.uitour-error-help');
      expect(errorHelp.text()).not.toContain('http://example.com:');
    });

    it('should include a colon in the error when there is a port number', () => {
      const preview = mount(<UnwrappedRecipePreview recipe={{}} />);
      preview.instance().currentURL = () => new URL('http://example.com:8000/control/');
      jasmine.clock().tick(1000);
      const errorHelp = preview.find('.uitour-error-help');
      expect(errorHelp.text()).toContain('http://example.com:8000');
    });
  });
});

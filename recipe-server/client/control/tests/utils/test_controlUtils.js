import React from 'react';
import ReactDOM from 'react-dom';

import closest from 'client/utils/closest';

describe('controlApp Utils', () => {
  describe('utils/closest', () => {
    it('should attempt to find a parent element based on selector', () => {
      // fired when react has created the dom element
      const onRender = testContainer => {
        const target = testContainer.querySelector('button');
        expect(closest(target, '.test') instanceof Element).toBe(true);
        expect(closest(target, '.nest') instanceof Element).toBe(true);

        expect(closest(target, 'li.nest') instanceof Element).toBe(false);

        expect(closest(target, 'div.nest') === closest(target, '.nest'))
          .toBe(true);

        expect(closest(target, '#nonexistant')).toBe(null);
      };

      ReactDOM.render(
        <div ref={onRender}>
          <span className="test">
            <div className="nest">
              <button className="target" />
            </div>
          </span>
        </div>,
        document.createElement('body')
      );
    });
  });
});

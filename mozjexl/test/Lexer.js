/*
 * Jexl
 * Copyright (c) 2015 TechnologyAdvice
 */
'use strict';

const Lexer = require('../lib/Lexer');
const grammar = require('../lib/grammar').elements;

let inst;

describe('Lexer', () => {
  beforeEach(() => {
    inst = new Lexer(grammar);
  });

  describe('Elements', () => {
    it('should count a string as one element', () => {
      const str = '"foo"';
      const elems = inst.getElements(str);
      elems.should.have.length(1);
      elems[0].should.equal(str);
    });

    it('should support single-quote strings', () => {
      const str = "'foo'";
      const elems = inst.getElements(str);
      elems.should.have.length(1);
      elems[0].should.equal(str);
    });

    it('should support escaping double-quotes', () => {
      const str = '"f\\"oo"';
      const elems = inst.getElements(str);
      elems.should.have.length(1);
      elems[0].should.equal(str);
    });

    it('should support escaping single-quotes', () => {
      const str = "'f\\'oo'";
      const elems = inst.getElements(str);
      elems.should.have.length(1);
      elems[0].should.equal(str);
    });

    it('should count an identifier as one element', () => {
      const str = 'alpha12345';
      const elems = inst.getElements(str);
      elems.should.deep.equal([str]);
    });

    it('should not split grammar elements out of transforms', () => {
      const str = 'inString';
      const elems = inst.getElements(str);
      elems.should.deep.equal([str]);
    });
  });
  describe('Tokens', () => {
    it('should unquote string elements', () => {
      const tokens = inst.getTokens(['"foo \\"bar\\\\"']);
      tokens.should.deep.equal([{
        type: 'literal',
        value: 'foo "bar\\',
        raw: '"foo \\"bar\\\\"',
      }]);
    });

    it('should recognize booleans', () => {
      const tokens = inst.getTokens(['true', 'false']);
      tokens.should.deep.equal([
        {
          type: 'literal',
          value: true,
          raw: 'true',
        },
        {
          type: 'literal',
          value: false,
          raw: 'false',
        },
      ]);
    });

    it('should recognize numerics', () => {
      const tokens = inst.getTokens(['-7.6', '20']);
      tokens.should.deep.equal([
        {
          type: 'literal',
          value: -7.6,
          raw: '-7.6',
        },
        {
          type: 'literal',
          value: 20,
          raw: '20',
        },
      ]);
    });

    it('should recognize binary operators', () => {
      const tokens = inst.getTokens(['+']);
      tokens.should.deep.equal([{
        type: 'binaryOp',
        value: '+',
        raw: '+',
      }]);
    });

    it('should recognize unary operators', () => {
      const tokens = inst.getTokens(['!']);
      tokens.should.deep.equal([{
        type: 'unaryOp',
        value: '!',
        raw: '!',
      }]);
    });

    it('should recognize control characters', () => {
      const tokens = inst.getTokens(['(']);
      tokens.should.deep.equal([{
        type: 'openParen',
        value: '(',
        raw: '(',
      }]);
    });

    it('should recognize identifiers', () => {
      const tokens = inst.getTokens(['_foo9_bar']);
      tokens.should.deep.equal([{
        type: 'identifier',
        value: '_foo9_bar',
        raw: '_foo9_bar',
      }]);
    });

    it('should throw on invalid token', () => {
      const fn = inst.getTokens.bind(Lexer, ['9foo']);
      fn.should.throw();
    });
  });

  it('should tokenize a full expression', () => {
    const tokens = inst.tokenize('6+x -  -17.55*y<= !foo.bar["baz\\"foz"]');
    tokens.should.deep.equal([
			{ type: 'literal', value: 6, raw: '6' },
			{ type: 'binaryOp', value: '+', raw: '+' },
			{ type: 'identifier', value: 'x', raw: 'x ' },
			{ type: 'binaryOp', value: '-', raw: '-  ' },
			{ type: 'literal', value: -17.55, raw: '-17.55' },
			{ type: 'binaryOp', value: '*', raw: '*' },
			{ type: 'identifier', value: 'y', raw: 'y' },
			{ type: 'binaryOp', value: '<=', raw: '<= ' },
			{ type: 'unaryOp', value: '!', raw: '!' },
			{ type: 'identifier', value: 'foo', raw: 'foo' },
			{ type: 'dot', value: '.', raw: '.' },
			{ type: 'identifier', value: 'bar', raw: 'bar' },
			{ type: 'openBracket', value: '[', raw: '[' },
			{ type: 'literal', value: 'baz"foz', raw: '"baz\\"foz"' },
			{ type: 'closeBracket', value: ']', raw: ']' },
    ]);
  });

  it('should consider minus to be negative appropriately', () => {
    inst.tokenize('-1?-2:-3').should.deep.equal([
			{ type: 'literal', value: -1, raw: '-1' },
			{ type: 'question', value: '?', raw: '?' },
			{ type: 'literal', value: -2, raw: '-2' },
			{ type: 'colon', value: ':', raw: ':' },
			{ type: 'literal', value: -3, raw: '-3' },
    ]);
  });
});

/*
 * Jexl
 * Copyright (c) 2015 TechnologyAdvice
 */
'use strict';

let chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  should = require('chai').should(),
  Lexer = require('../../lib/Lexer'),
  Parser = require('../../lib/parser/Parser'),
  Evaluator = require('../../lib/evaluator/Evaluator'),
  grammar = require('../../lib/grammar').elements;

chai.use(chaiAsPromised);

const lexer = new Lexer(grammar);

function toTree(exp) {
  const p = new Parser(grammar);
  p.addTokens(lexer.tokenize(exp));
  return p.complete();
}

describe('Evaluator', () => {
  it('should evaluate an arithmetic expression', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('(2 + 3) * 4')).should.become(20);
  });
  it('should evaluate a string concat', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('"Hello" + (4+4) + "Wo\\"rld"'))
			.should.become('Hello8Wo"rld');
  });
  it('should evaluate a true comparison expression', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('2 > 1')).should.become(true);
  });
  it('should evaluate a false comparison expression', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('2 <= 1')).should.become(false);
  });
  it('should evaluate a complex expression', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('"foo" && 6 >= 6 && 0 + 1 && true'))
			.should.become(true);
  });
  it('should evaluate an identifier chain', () => {
    let context = { foo: { baz: { bar: 'tek' } } },
      e = new Evaluator(grammar, null, context);
    return e.eval(toTree('foo.baz.bar'))
			.should.become(context.foo.baz.bar);
  });
  it('should apply transforms', () => {
    let context = { foo: 10 },
      half = function (val) {
        return val / 2;
      },
      e = new Evaluator(grammar, { half }, context);
    return e.eval(toTree('foo|half + 3')).should.become(8);
  });
  it('should filter arrays', () => {
    let context = { foo: { bar: [
				{ tek: 'hello' },
				{ tek: 'baz' },
				{ tok: 'baz' },
      ] } },
      e = new Evaluator(grammar, null, context);
    return e.eval(toTree('foo.bar[.tek == "baz"]'))
			.should.eventually.deep.equal([{ tek: 'baz' }]);
  });
  it('should assume array index 0 when traversing', () => {
    let context = { foo: { bar: [
				{ tek: { hello: 'world' } },
				{ tek: { hello: 'universe' } },
      ] } },
      e = new Evaluator(grammar, null, context);
    return e.eval(toTree('foo.bar.tek.hello')).should.become('world');
  });
  it('should make array elements addressable by index', () => {
    let context = { foo: { bar: [
				{ tek: 'tok' },
				{ tek: 'baz' },
				{ tek: 'foz' },
      ] } },
      e = new Evaluator(grammar, null, context);
    return e.eval(toTree('foo.bar[1].tek')).should.become('baz');
  });
  it('should allow filters to select object properties', () => {
    let context = { foo: { baz: { bar: 'tek' } } },
      e = new Evaluator(grammar, null, context);
    return e.eval(toTree('foo["ba" + "z"].bar'))
			.should.become(context.foo.baz.bar);
  });
  it('should allow simple filters on undefined objects', () => {
    let context = { foo: {} },
		    e = new Evaluator(grammar, null, context);
    return e.eval(toTree('foo.bar["baz"].tok'))
			.should.become(undefined);
  });
  it('should allow complex filters on undefined objects', () => {
    let context = { foo: {} },
		    e = new Evaluator(grammar, null, context);
    return e.eval(toTree('foo.bar[.size > 1].baz'))
			.should.become(undefined);
  });
  it('should throw when transform does not exist', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('"hello"|world')).should.reject;
  });
  it('should apply the DivFloor operator', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('7 // 2')).should.become(3);
  });
  it('should evaluate an object literal', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('{foo: {bar: "tek"}}'))
			.should.eventually.deep.equal({ foo: { bar: 'tek' } });
  });
  it('should evaluate an empty object literal', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('{}'))
			.should.eventually.deep.equal({});
  });
  it('should evaluate a transform with multiple args', () => {
    const e = new Evaluator(grammar, {
      concat(val, a1, a2, a3) {
        return `${val}: ${a1}${a2}${a3}`;
      },
    });
    return e.eval(toTree('"foo"|concat("baz", "bar", "tek")'))
			.should.become('foo: bazbartek');
  });
  it('should evaluate dot notation for object literals', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('{foo: "bar"}.foo')).should.become('bar');
  });
  it('should allow access to literal properties', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('"foo".length')).should.become(3);
  });
  it('should evaluate array literals', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('["foo", 1+2]'))
			.should.eventually.deep.equal(['foo', 3]);
  });
  it('should apply the "in" operator to strings', () => {
    const e = new Evaluator(grammar);
    return Promise.all([
      e.eval(toTree('"bar" in "foobartek"')).should.become(true),
      e.eval(toTree('"baz" in "foobartek"')).should.become(false),
    ]);
  });
  it('should apply the "in" operator to arrays', () => {
    const e = new Evaluator(grammar);
    return Promise.all([
      e.eval(toTree('"bar" in ["foo","bar","tek"]')).should.become(true),
      e.eval(toTree('"baz" in ["foo","bar","tek"]')).should.become(false),
    ]);
  });
  it('should evaluate a conditional expression', () => {
    const e = new Evaluator(grammar);
    return Promise.all([
      e.eval(toTree('"foo" ? 1 : 2')).should.become(1),
      e.eval(toTree('"" ? 1 : 2')).should.become(2),
    ]);
  });
  it('should allow missing consequent in ternary', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('"foo" ?: "bar"')).should.become('foo');
  });
  it('does not treat falsey properties as undefined', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('"".length')).should.become(0);
  });
  it('should handle an expression with arbitrary whitespace', () => {
    const e = new Evaluator(grammar);
    return e.eval(toTree('(\t2\n+\n3) *\n4\n\r\n')).should.become(20);
  });
});

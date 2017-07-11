/*
 * Jexl
 * Copyright (c) 2015 TechnologyAdvice
 */
'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const should = require('chai').should();
const Jexl = require('../lib/Jexl');

chai.use(chaiAsPromised);

let inst;

describe('Jexl', () => {
  beforeEach(() => {
    inst = new Jexl.Jexl();
  });

  it('should resolve Promise on success', () => inst.eval('2+2').should.become(4));

  it('should reject Promise on error', () => inst.eval('2++2').should.reject);

  it('should call callback with success result', (done) => {
    inst.eval('2+2', (err, res) => {
      res.should.equal(4);
      done(err);
    });
  });

  it('should call callback with error result', (done) => {
    inst.eval('2++2', (err, res) => {
      should.exist(err);
      should.not.exist(res);
      done();
    });
  });

  it('should allow transforms to be defined', () => {
    inst.addTransform('toCase', (val, args) => {
      if (args.case === 'upper') { return val.toUpperCase(); }
      return val.toLowerCase();
    });
    return inst.eval('"hello"|toCase({case:"upper"})')
			.should.become('HELLO');
  });

  it('should allow transforms to be retrieved', () => {
    inst.addTransform('ret2', () => 2);
    const t = inst.getTransform('ret2');
    should.exist(t);
    t().should.equal(2);
  });

  it('should allow transforms to be set in batch', () => {
    inst.addTransforms({
      add1(val) { return val + 1; },
      add2(val) { return val + 2; },
    });
    return inst.eval('2|add1|add2').should.become(5);
  });

  it('should pass context', () => inst.eval('foo', { foo: 'bar' }).should.become('bar'));

  it('should allow binaryOps to be defined', () => {
    inst.addBinaryOp('_=', 20, (left, right) => left.toLowerCase() === right.toLowerCase());
    return inst.eval('"FoO" _= "fOo"').should.become(true);
  });

  it('should observe weight on binaryOps', () => {
    inst.addBinaryOp('**', 0, (left, right) => left * 2 + right * 2);
    inst.addBinaryOp('***', 1000, (left, right) => left * 2 + right * 2);
    return Promise.all([
      inst.eval('1 + 2 ** 3 + 4'),
      inst.eval('1 + 2 *** 3 + 4'),
    ]).should.become([20, 15]);
  });

  it('should allow unaryOps to be defined', () => {
    inst.addUnaryOp('~', (right) => Math.floor(right));
    return inst.eval('~5.7 + 5').should.become(10);
  });

  it('should allow binaryOps to be removed', () => {
    inst.removeOp('+');
    return inst.eval('1+2').should.reject;
  });

  it('should allow unaryOps to be removed', () => {
    inst.removeOp('!');
    return inst.eval('!true').should.reject;
  });
});

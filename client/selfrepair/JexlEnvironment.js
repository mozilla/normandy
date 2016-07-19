import { Jexl } from 'jexl';
import { stableSample } from './utils.js';

export default class JexlEnvironment {
  constructor(context) {
    this.context = context;
    this.jexl = new Jexl();
    this.jexl.addTransform('date', value => new Date(value));
    this.jexl.addTransform('stableSample', stableSample);
  }

  eval(expr) {
    const oneLineExpr = expr.replace(/\r?\n|\r/g, ' ');
    return this.jexl.eval(oneLineExpr, this.context);
  }
}

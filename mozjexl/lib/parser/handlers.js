/*
 * Jexl
 * Copyright (c) 2015 TechnologyAdvice
 */
'use strict';

module.exports = {
   /**
    * Handles a subexpression that's used to define a transform argument's value.
    * @param {{type: <string>}} ast The subexpression tree
    */
  argVal(ast) {
    this._cursor.args.push(ast);
  },

   /**
    * Handles new array literals by adding them as a new node in the AST,
    * initialized with an empty array.
    */
  arrayStart() {
    this._placeAtCursor({
      type: 'ArrayLiteral',
      value: [],
    });
  },

   /**
    * Handles a subexpression representing an element of an array literal.
    * @param {{type: <string>}} ast The subexpression tree
    */
  arrayVal(ast) {
    if (ast) { this._cursor.value.push(ast); }
  },

   /**
    * Handles tokens of type 'binaryOp', indicating an operation that has two
    * inputs: a left side and a right side.
    * @param {{type: <string>}} token A token object
    */
  binaryOp(token) {
    const precedence = this._grammar[token.value].precedence || 0;
    let parent = this._cursor._parent;
    while (parent && parent.operator &&
                           this._grammar[parent.operator].precedence >= precedence) {
      this._cursor = parent;
      parent = parent._parent;
    }
    const node = {
      type: 'BinaryExpression',
      operator: token.value,
      left: this._cursor,
    };
    this._setParent(this._cursor, node);
    this._cursor = parent;
    this._placeAtCursor(node);
  },

   /**
    * Handles successive nodes in an identifier chain.  More specifically, it
    * sets values that determine how the following identifier gets placed in the
    * AST.
    */
  dot() {
    this._nextIdentEncapsulate = this._cursor &&
                   (this._cursor.type !== 'BinaryExpression' ||
                   (this._cursor.type === 'BinaryExpression' && this._cursor.right)) &&
                   this._cursor.type !== 'UnaryExpression';
    this._nextIdentRelative = !this._cursor ||
                   (this._cursor && !this._nextIdentEncapsulate);
    if (this._nextIdentRelative) { this._relative = true; }
  },

   /**
    * Handles a subexpression used for filtering an array returned by an
    * identifier chain.
    * @param {{type: <string>}} ast The subexpression tree
    */
  filter(ast) {
    this._placeBeforeCursor({
      type: 'FilterExpression',
      expr: ast,
      relative: this._subParser.isRelative(),
      subject: this._cursor,
    });
  },

   /**
    * Handles identifier tokens by adding them as a new node in the AST.
    * @param {{type: <string>}} token A token object
    */
  identifier(token) {
    const node = {
      type: 'Identifier',
      value: token.value,
    };
    if (this._nextIdentEncapsulate) {
      node.from = this._cursor;
      this._placeBeforeCursor(node);
      this._nextIdentEncapsulate = false;
    }	else {
      if (this._nextIdentRelative) { node.relative = true; }
      this._placeAtCursor(node);
    }
  },

   /**
    * Handles literal values, such as strings, booleans, and numerics, by adding
    * them as a new node in the AST.
    * @param {{type: <string>}} token A token object
    */
  literal(token) {
    this._placeAtCursor({
      type: 'Literal',
      value: token.value,
    });
  },

   /**
    * Queues a new object literal key to be written once a value is collected.
    * @param {{type: <string>}} token A token object
    */
  objKey(token) {
    this._curObjKey = token.value;
  },

  /**
   * Handles new object literals by adding them as a new node in the AST,
   * initialized with an empty object.
   */
  objStart() {
    this._placeAtCursor({
      type: 'ObjectLiteral',
      value: {},
    });
  },

  /**
   * Handles an object value by adding its AST to the queued key on the object
   * literal node currently at the cursor.
   * @param {{type: <string>}} ast The subexpression tree
   */
  objVal(ast) {
    this._cursor.value[this._curObjKey] = ast;
  },

  /**
   * Handles traditional subexpressions, delineated with the groupStart and
   * groupEnd elements.
   * @param {{type: <string>}} ast The subexpression tree
   */
  subExpression(ast) {
    this._placeAtCursor(ast);
  },

  /**
   * Handles a completed alternate subexpression of a ternary operator.
   * @param {{type: <string>}} ast The subexpression tree
   */
  ternaryEnd(ast) {
    this._cursor.alternate = ast;
  },

  /**
   * Handles a completed consequent subexpression of a ternary operator.
   * @param {{type: <string>}} ast The subexpression tree
   */
  ternaryMid(ast) {
    this._cursor.consequent = ast;
  },

  /**
   * Handles the start of a new ternary expression by encapsulating the entire
   * AST in a ConditionalExpression node, and using the existing tree as the
   * test element.
   */
  ternaryStart() {
    this._tree = {
      type: 'ConditionalExpression',
      test: this._tree,
    };
    this._cursor = this._tree;
  },

  /**
   * Handles identifier tokens when used to indicate the name of a transform to
   * be applied.
   * @param {{type: <string>}} token A token object
   */
  transform(token) {
    this._placeBeforeCursor({
      type: 'Transform',
      name: token.value,
      args: [],
      subject: this._cursor,
    });
  },

  /**
   * Handles token of type 'unaryOp', indicating that the operation has only
   * one input: a right side.
   * @param {{type: <string>}} token A token object
   */
  unaryOp(token) {
    this._placeAtCursor({
      type: 'UnaryExpression',
      operator: token.value,
    });
  },
};

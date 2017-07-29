
expression = process.argv[2] || 'normandy.clientId=="abced" && channel=="nightly"';
console.log(`

  EXPRESSION TO PARSE

  ${expression}

`)

var Evaluator = require('./evaluator/Evaluator'),
  Lexer = require('./Lexer'),
  Parser = require('./parser/Parser'),
  defaultGrammar = require('./grammar').elements;

P = new Parser(defaultGrammar);
P.addTokens(new Lexer(defaultGrammar).tokenize(expression))

function findIdsInTree (jexlParseTree) {
  const out = [];
  const tree = jexlParseTree;
  function recurse (tree) {
    if (!tree) {
      return
    }
    console.log(tree);
    if (tree.type === "Identifier") {
      out.push(tree.value);
    }
    recurse(tree.left);
    recurse(tree.right);
  };
  recurse(tree);
  return out;
}
out = findIdsInTree(P._tree);
console.log(`\nidentifiers: ${JSON.stringify(out)}`)

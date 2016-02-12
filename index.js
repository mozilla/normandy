module.exports = {
    "extends": "eslint:recommended",
    "parser": "babel-eslint",
    "plugins": ["babel"],
    "rules": {
        "consistent-return": 2,
        "eqeqeq": 2,
        "semi": [2, "always"],

        "babel/array-bracket-spacing": 1,
        "babel/arrow-parens": [1, "as-needed"],
        "babel/new-cap": 1,
        "babel/object-curly-spacing": 1,
        "comma-dangle": [1, "always-multiline"],
        "indent": [1, 4, {"SwitchCase": 1}],
        "linebreak-style": [1, "unix"],
        "no-unused-vars": [1],
        "quotes": [1, "single", "avoid-escape"],

        "strict": 0
    },
    "env": {
        "es6": true,
    }
};

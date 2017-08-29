module.exports = {
    "plugins": ["node"],
    "extends": ["google", "plugin:node/recommended"],
    "parser": "babel-eslint",
    "env": {
        "node": true,
        "es6": true
    },
    "rules": {
        "require-jsdoc": 0,
        "max-len": 0
    }
};

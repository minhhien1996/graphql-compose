"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _graphql = require("../graphql");

/*  strict */
function coerceDate(value) {
  const json = JSON.stringify(value);
  return json.replace(/"/g, "'");
}

const GenericType = new _graphql.GraphQLScalarType({
  name: 'Generic',
  serialize: coerceDate,
  parseValue: coerceDate,

  parseLiteral(ast) {
    if (ast.kind !== _graphql.Kind.STRING) {
      throw new _graphql.GraphQLError(`Query error: Can only parse strings to buffers but got a: ${ast.kind}`, [ast]);
    }

    const json = ast.value.replace(/'/g, '"');
    return JSON.parse(json);
  }

});
var _default = GenericType;
exports.default = _default;
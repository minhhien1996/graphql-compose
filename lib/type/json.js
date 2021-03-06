"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _graphqlTypeJson = _interopRequireDefault(require("graphql-type-json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*  strict */
var _default = _graphqlTypeJson.default; // import { GraphQLScalarType, Kind } from '../graphql';
//
// function identity(value) {
//   return value;
// }
//
// function parseLiteral(ast) {
//   switch (ast.kind) {
//     case Kind.STRING:
//     case Kind.BOOLEAN:
//       return ast.value;
//     case Kind.INT:
//     case Kind.FLOAT:
//       return parseFloat(ast.value);
//     case Kind.OBJECT: {
//       const value = Object.create(null);
//       ast.fields.forEach(field => {
//         value[field.name.value] = parseLiteral(field.value);
//       });
//
//       return value;
//     }
//     case Kind.LIST:
//       return ast.values.map(parseLiteral);
//     case Kind.NULL:
//       return null;
//     default:
//       return undefined;
//   }
// }
//
// export default new GraphQLScalarType({
//   name: 'JSON',
//   description:
//     'The `JSON` scalar type represents JSON values as specified by ' +
//     '[ECMA-404](http://www.ecma-international.org/' +
//     'publications/files/ECMA-ST/ECMA-404.pdf).',
//   serialize: identity,
//   parseValue: identity,
//   parseLiteral,
// });

exports.default = _default;
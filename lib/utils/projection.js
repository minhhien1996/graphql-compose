"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getProjectionFromAST = getProjectionFromAST;
exports.getProjectionFromASTquery = getProjectionFromASTquery;
exports.getFlatProjectionFromAST = getFlatProjectionFromAST;
exports.extendByFieldProjection = extendByFieldProjection;

var _graphql = require("../graphql");

var _deepmerge = _interopRequireDefault(require("./deepmerge"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*  strict */

/* eslint-disable no-param-reassign, no-lonely-if */
const FIELD = _graphql.Kind.FIELD,
      FRAGMENT_SPREAD = _graphql.Kind.FRAGMENT_SPREAD,
      INLINE_FRAGMENT = _graphql.Kind.INLINE_FRAGMENT; // export type ProjectionType = { [fieldName: string]: $Shape<ProjectionNode> | true };
// export type ProjectionNode = { [fieldName: string]: $Shape<ProjectionNode> } | true;

function getProjectionFromAST(context, fieldNode) {
  if (!context) {
    return {};
  }

  const queryProjection = getProjectionFromASTquery(context, fieldNode);
  const queryExtProjection = extendByFieldProjection(context.returnType, queryProjection);
  return queryExtProjection;
}

function getProjectionFromASTquery(context, fieldNode) {
  if (!context) {
    return {};
  }

  let selections; // Array<FieldNode | InlineFragmentNode | FragmentSpreadNode>;

  if (fieldNode) {
    if (fieldNode.selectionSet) {
      selections = fieldNode.selectionSet.selections;
    }
  } else if (Array.isArray(context.fieldNodes)) {
    // get all selectionSets
    selections = context.fieldNodes.reduce((result, source) => {
      if (source.selectionSet) {
        result.push(...source.selectionSet.selections);
      }

      return result;
    }, []);
  }

  const projection = (selections || []).reduce((res, ast) => {
    switch (ast.kind) {
      case FIELD:
        {
          const value = ast.name.value;

          if (res[value]) {
            res[value] = (0, _deepmerge.default)(res[value], getProjectionFromASTquery(context, ast) || true);
          } else {
            res[value] = getProjectionFromASTquery(context, ast) || true;
          }

          return res;
        }

      case INLINE_FRAGMENT:
        return (0, _deepmerge.default)(res, getProjectionFromASTquery(context, ast));

      case FRAGMENT_SPREAD:
        return (0, _deepmerge.default)(res, getProjectionFromASTquery(context, context.fragments[ast.name.value]));

      default:
        throw new Error('Unsuported query selection');
    }
  }, {});
  return projection;
}

function getFlatProjectionFromAST(context, fieldNodes) {
  const projection = getProjectionFromAST(context, fieldNodes) || {};
  const flatProjection = {};
  Object.keys(projection).forEach(key => {
    flatProjection[key] = !!projection[key];
  });
  return flatProjection;
} // This method traverse fields and extends current projection
// by projection from fields


function extendByFieldProjection(returnType, projection) {
  let type = returnType;

  while (type instanceof _graphql.GraphQLList || type instanceof _graphql.GraphQLNonNull) {
    type = type.ofType;
  }

  if (!(type instanceof _graphql.GraphQLObjectType || type instanceof _graphql.GraphQLInterfaceType)) {
    return projection;
  }

  let proj = projection;
  Object.keys(proj).forEach(key => {
    const field = type._fields[key];
    if (!field) return;
    if (field.projection) proj = (0, _deepmerge.default)(proj, field.projection);
    proj[key] = extendByFieldProjection(field.type, proj[key]);
  });
  return proj;
}
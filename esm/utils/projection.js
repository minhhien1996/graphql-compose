/*  strict */

/* eslint-disable no-param-reassign, no-lonely-if */
import { Kind, GraphQLObjectType, GraphQLList, GraphQLNonNull, GraphQLInterfaceType } from '../graphql';
import deepmerge from './deepmerge';
const FIELD = Kind.FIELD,
      FRAGMENT_SPREAD = Kind.FRAGMENT_SPREAD,
      INLINE_FRAGMENT = Kind.INLINE_FRAGMENT; // export type ProjectionType = { [fieldName: string]: $Shape<ProjectionNode> | true };
// export type ProjectionNode = { [fieldName: string]: $Shape<ProjectionNode> } | true;

export function getProjectionFromAST(context, fieldNode) {
  if (!context) {
    return {};
  }

  const queryProjection = getProjectionFromASTquery(context, fieldNode);
  const queryExtProjection = extendByFieldProjection(context.returnType, queryProjection);
  return queryExtProjection;
}
export function getProjectionFromASTquery(context, fieldNode) {
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
            res[value] = deepmerge(res[value], getProjectionFromASTquery(context, ast) || true);
          } else {
            res[value] = getProjectionFromASTquery(context, ast) || true;
          }

          return res;
        }

      case INLINE_FRAGMENT:
        return deepmerge(res, getProjectionFromASTquery(context, ast));

      case FRAGMENT_SPREAD:
        return deepmerge(res, getProjectionFromASTquery(context, context.fragments[ast.name.value]));

      default:
        throw new Error('Unsuported query selection');
    }
  }, {});
  return projection;
}
export function getFlatProjectionFromAST(context, fieldNodes) {
  const projection = getProjectionFromAST(context, fieldNodes) || {};
  const flatProjection = {};
  Object.keys(projection).forEach(key => {
    flatProjection[key] = !!projection[key];
  });
  return flatProjection;
} // This method traverse fields and extends current projection
// by projection from fields

export function extendByFieldProjection(returnType, projection) {
  let type = returnType;

  while (type instanceof GraphQLList || type instanceof GraphQLNonNull) {
    type = type.ofType;
  }

  if (!(type instanceof GraphQLObjectType || type instanceof GraphQLInterfaceType)) {
    return projection;
  }

  let proj = projection;
  Object.keys(proj).forEach(key => {
    const field = type._fields[key];
    if (!field) return;
    if (field.projection) proj = deepmerge(proj, field.projection);
    proj[key] = extendByFieldProjection(field.type, proj[key]);
  });
  return proj;
}
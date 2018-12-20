"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.typeByPath = typeByPath;
exports.typeByPathTC = typeByPathTC;
exports.typeByPathITC = typeByPathITC;
exports.typeByPathFTC = typeByPathFTC;
exports.processType = processType;

var _graphql = require("../graphql");

var _TypeComposer = require("../TypeComposer");

var _InputTypeComposer = require("../InputTypeComposer");

var _InterfaceTypeComposer = require("../InterfaceTypeComposer");

var _Resolver = require("../Resolver");

/*  strict */

/* eslint-disable no-use-before-define */

/**
 * fieldName
 * @argName
 * #resolver
 */
function typeByPath(src, path) {
  const parts = Array.isArray(path) ? path : String(path).split('.');

  if (parts.length === 0) {
    return src;
  }

  if (src instanceof _TypeComposer.TypeComposer) {
    return typeByPathTC(src, parts);
  } else if (src instanceof _InputTypeComposer.InputTypeComposer) {
    return typeByPathITC(src, parts);
  } else if (src instanceof _Resolver.Resolver) {
    return typeByPathRSV(src, parts);
  } else if (src instanceof _InterfaceTypeComposer.InterfaceTypeComposer) {
    return typeByPathFTC(src, parts);
  }

  return src;
}

function typeByPathTC(tc, parts) {
  if (!tc) return undefined;
  if (parts.length === 0) return tc;
  const name = parts[0];
  if (!name) return undefined;
  const nextName = parts[1];

  if (name.startsWith('$')) {
    const restParts = parts.slice(1);
    const resolver = tc.getResolver(name.substring(1));

    if (resolver) {
      if (restParts.length > 0) {
        return typeByPathRSV(resolver, restParts);
      }

      return resolver;
    }

    return undefined;
  }

  if (nextName && nextName.startsWith('@')) {
    const argType = tc.getFieldArgType(name, nextName.substring(1));
    return processType(argType, parts.slice(2), tc.constructor.schemaComposer);
  }

  const fieldType = tc.getFieldType(name);
  return processType(fieldType, parts.slice(1), tc.constructor.schemaComposer);
}

function typeByPathITC(itc, parts) {
  if (!itc) return undefined;
  if (parts.length === 0) return itc;
  const fieldType = itc.getFieldType(parts[0]);
  return processType(fieldType, parts.slice(1), itc.constructor.schemaComposer);
}

function typeByPathRSV(rsv, parts) {
  if (!rsv) return undefined;
  if (parts.length === 0) return rsv;
  const name = parts[0];
  if (!name) return undefined;

  if (name.startsWith('@')) {
    const argName = name.substring(1);
    const arg = rsv.getArg(argName);
    if (!arg) return undefined;
    return processType(rsv.getArgType(argName), parts.slice(1), rsv.constructor.schemaComposer);
  }

  return processType(rsv.getType(), parts, rsv.constructor.schemaComposer);
}

function typeByPathFTC(tc, parts) {
  if (!tc) return undefined;
  if (parts.length === 0) return tc;
  const name = parts[0];
  if (!name) return undefined;
  const nextName = parts[1];

  if (name.startsWith('$')) {
    // Interface does not have resolvers
    return undefined;
  }

  if (nextName && nextName.startsWith('@')) {
    const argType = tc.getFieldArgType(name, nextName.substring(1));
    return processType(argType, parts.slice(2), tc.constructor.schemaComposer);
  }

  const fieldType = tc.getFieldType(name);
  return processType(fieldType, parts.slice(1), tc.constructor.schemaComposer);
}

function processType(type, restParts, schema) {
  if (!type) return undefined;
  const unwrappedType = (0, _graphql.getNamedType)(type);

  if (unwrappedType instanceof _graphql.GraphQLObjectType) {
    const tc = new schema.TypeComposer(unwrappedType);

    if (restParts.length > 0) {
      return typeByPathTC(tc, restParts);
    }

    return tc;
  } else if (unwrappedType instanceof _graphql.GraphQLInputObjectType) {
    const itc = new schema.InputTypeComposer(unwrappedType);

    if (restParts.length > 0) {
      return typeByPathITC(itc, restParts);
    }

    return itc;
  }

  if (restParts.length > 0) {
    return undefined;
  }

  return unwrappedType;
}
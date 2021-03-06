"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getGraphqlVersion = getGraphqlVersion;
exports.graphqlVersion = void 0;

/*  strict */

/* eslint-disable global-require */
function getGraphqlVersion() {
  const graphql = require('../graphql');

  if (graphql.getOperationRootType) {
    return 14.0;
  } else if (graphql.lexicographicSortSchema) {
    return 13.0;
  } else if (graphql.lexographicSortSchema) {
    // 0.13-rc.1
    return 13.0;
  }

  return 11.0;
}

const graphqlVersion = getGraphqlVersion();
exports.graphqlVersion = graphqlVersion;
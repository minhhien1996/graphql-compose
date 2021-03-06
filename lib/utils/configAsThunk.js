"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolveOutputConfigAsThunk = resolveOutputConfigAsThunk;
exports.resolveOutputConfigMapAsThunk = resolveOutputConfigMapAsThunk;
exports.resolveInputConfigAsThunk = resolveInputConfigAsThunk;
exports.resolveInputConfigMapAsThunk = resolveInputConfigMapAsThunk;
exports.resolveArgConfigAsThunk = resolveArgConfigAsThunk;
exports.resolveArgConfigMapAsThunk = resolveArgConfigMapAsThunk;

var _is = require("./is");

/*  strict */

/* eslint-disable no-use-before-define */
function resolveOutputConfigAsThunk(schema, fc, name, typeName = '') {
  const fieldConfig = schema.typeMapper.convertOutputFieldConfig((0, _is.isFunction)(fc) ? fc() : fc, name, typeName);

  if ((0, _is.isFunction)(fieldConfig.type)) {
    fieldConfig.type = schema.typeMapper.convertOutputFieldConfig(fieldConfig.type(), name, typeName).type;
  }

  if ((0, _is.isObject)(fieldConfig.args)) {
    fieldConfig.args = resolveArgConfigMapAsThunk(schema, fieldConfig.args, name, typeName);
  }

  return fieldConfig;
}

function resolveOutputConfigMapAsThunk(schema, fieldMap, typeName = '') {
  const fields = {};

  if ((0, _is.isObject)(fieldMap)) {
    Object.keys(fieldMap).forEach(name => {
      fields[name] = resolveOutputConfigAsThunk(schema, fieldMap[name], name, typeName);
    });
  }

  return fields;
}

function resolveInputConfigAsThunk(schema, fc, name, typeName) {
  const fieldConfig = schema.typeMapper.convertInputFieldConfig((0, _is.isFunction)(fc) ? fc() : fc, name, typeName);

  if ((0, _is.isFunction)(fieldConfig.type)) {
    fieldConfig.type = schema.typeMapper.convertInputFieldConfig(fieldConfig.type(), name, typeName).type;
  }

  return fieldConfig;
}

function resolveInputConfigMapAsThunk(schema, fieldMap, typeName) {
  const fields = {};

  if ((0, _is.isObject)(fieldMap)) {
    Object.keys(fieldMap).forEach(name => {
      fields[name] = resolveInputConfigAsThunk(schema, fieldMap[name], name, typeName);
    });
  }

  return fields;
}

function resolveArgConfigAsThunk(schema, ac, name, fieldName, typeName) {
  const argConfig = schema.typeMapper.convertArgConfig((0, _is.isFunction)(ac) ? ac() : ac, name, fieldName, typeName);

  if ((0, _is.isFunction)(argConfig.type)) {
    argConfig.type = schema.typeMapper.convertArgConfig(argConfig.type(), name, typeName).type;
  }

  return argConfig;
}

function resolveArgConfigMapAsThunk(schema, argMap, fieldName, typeName) {
  const args = {};

  if ((0, _is.isObject)(argMap)) {
    Object.keys(argMap).forEach(name => {
      args[name] = resolveArgConfigAsThunk(schema, argMap[name], name, fieldName, typeName);
    });
  }

  return args;
}
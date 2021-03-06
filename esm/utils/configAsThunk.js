/*  strict */

/* eslint-disable no-use-before-define */
import { isFunction, isObject } from './is';
export function resolveOutputConfigAsThunk(schema, fc, name, typeName = '') {
  const fieldConfig = schema.typeMapper.convertOutputFieldConfig(isFunction(fc) ? fc() : fc, name, typeName);

  if (isFunction(fieldConfig.type)) {
    fieldConfig.type = schema.typeMapper.convertOutputFieldConfig(fieldConfig.type(), name, typeName).type;
  }

  if (isObject(fieldConfig.args)) {
    fieldConfig.args = resolveArgConfigMapAsThunk(schema, fieldConfig.args, name, typeName);
  }

  return fieldConfig;
}
export function resolveOutputConfigMapAsThunk(schema, fieldMap, typeName = '') {
  const fields = {};

  if (isObject(fieldMap)) {
    Object.keys(fieldMap).forEach(name => {
      fields[name] = resolveOutputConfigAsThunk(schema, fieldMap[name], name, typeName);
    });
  }

  return fields;
}
export function resolveInputConfigAsThunk(schema, fc, name, typeName) {
  const fieldConfig = schema.typeMapper.convertInputFieldConfig(isFunction(fc) ? fc() : fc, name, typeName);

  if (isFunction(fieldConfig.type)) {
    fieldConfig.type = schema.typeMapper.convertInputFieldConfig(fieldConfig.type(), name, typeName).type;
  }

  return fieldConfig;
}
export function resolveInputConfigMapAsThunk(schema, fieldMap, typeName) {
  const fields = {};

  if (isObject(fieldMap)) {
    Object.keys(fieldMap).forEach(name => {
      fields[name] = resolveInputConfigAsThunk(schema, fieldMap[name], name, typeName);
    });
  }

  return fields;
}
export function resolveArgConfigAsThunk(schema, ac, name, fieldName, typeName) {
  const argConfig = schema.typeMapper.convertArgConfig(isFunction(ac) ? ac() : ac, name, fieldName, typeName);

  if (isFunction(argConfig.type)) {
    argConfig.type = schema.typeMapper.convertArgConfig(argConfig.type(), name, typeName).type;
  }

  return argConfig;
}
export function resolveArgConfigMapAsThunk(schema, argMap, fieldName, typeName) {
  const args = {};

  if (isObject(argMap)) {
    Object.keys(argMap).forEach(name => {
      args[name] = resolveArgConfigAsThunk(schema, argMap[name], name, fieldName, typeName);
    });
  }

  return args;
}
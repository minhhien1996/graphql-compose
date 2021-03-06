function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*  strict */

/* eslint-disable no-use-before-define */
// This is internal methods of graphql-js (introduced in 14.0.0)
// required for corret config convertion to internal field definition of types
// copy pasted from https://github.com/graphql/graphql-js/blame/master/src/type/definition.js
// Methods *ToConfig was written by @nodkz for converting internal fields to config objects
import invariant from 'graphql/jsutils/invariant';
import { resolveMaybeThunk } from './misc';

function isPlainObj(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

function inspect(value) {
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);

    case 'function':
      return value.name ? `[function ${value.name}]` : '[function]';

    case 'object':
      if (value) {
        if (typeof value.inspect === 'function') {
          return value.inspect();
        } else if (Array.isArray(value)) {
          return `[${value.map(inspect).join(', ')}]`;
        }

        const properties = Object.keys(value).map(k => `${k}: ${inspect(value[k])}`).join(', ');
        return properties ? `{ ${properties} }` : '{}';
      }

      return String(value);

    default:
      return String(value);
  }
}

export function defineFieldMap(config, fieldMap) {
  invariant(isPlainObj(fieldMap), `${config.name} fields must be an object with field names as keys or a ` + 'function which returns such an object.');
  const resultFieldMap = Object.create(null);

  var _arr = Object.keys(fieldMap);

  for (var _i = 0; _i < _arr.length; _i++) {
    const fieldName = _arr[_i];
    const fieldConfig = fieldMap[fieldName];
    invariant(isPlainObj(fieldConfig), `${config.name}.${fieldName} field config must be an object`);
    invariant(!fieldConfig.hasOwnProperty('isDeprecated'), `${config.name}.${fieldName} should provide "deprecationReason" ` + 'instead of "isDeprecated".');

    const field = _objectSpread({}, fieldConfig, {
      isDeprecated: Boolean(fieldConfig.deprecationReason),
      name: fieldName
    });

    invariant(field.resolve == null || typeof field.resolve === 'function', `${config.name}.${fieldName} field resolver must be a function if ` + `provided, but got: ${inspect(field.resolve)}.`);
    const argsConfig = fieldConfig.args;

    if (!argsConfig) {
      field.args = [];
    } else {
      invariant(isPlainObj(argsConfig), `${config.name}.${fieldName} args must be an object with argument names as keys.`);
      field.args = Object.keys(argsConfig).map(argName => {
        const arg = argsConfig[argName];
        return {
          name: argName,
          description: arg.description === undefined ? null : arg.description,
          type: arg.type,
          defaultValue: arg.defaultValue,
          astNode: arg.astNode
        };
      });
    }

    resultFieldMap[fieldName] = field;
  }

  return resultFieldMap;
}
export function defineFieldMapToConfig(fieldMap) {
  const fields = {};

  const _fields = resolveMaybeThunk(fieldMap);

  Object.keys(_fields).forEach(n => {
    const _fields$n = _fields[n],
          name = _fields$n.name,
          isDeprecated = _fields$n.isDeprecated,
          fc = _objectWithoutPropertiesLoose(_fields$n, ["name", "isDeprecated"]);

    if (Array.isArray(fc.args)) {
      const args = {};
      fc.args.forEach((_ref) => {
        let argName = _ref.name,
            ac = _objectWithoutPropertiesLoose(_ref, ["name"]);

        args[argName] = ac;
      });
      fc.args = args;
    }

    fields[n] = fc;
  });
  return fields;
}
export function defineEnumValues(type, valueMap
/* <T> */
) {
  invariant(isPlainObj(valueMap), `${type.name} values must be an object with value names as keys.`);
  return Object.keys(valueMap).map(valueName => {
    const value = valueMap[valueName];
    invariant(isPlainObj(value), `${type.name}.${valueName} must refer to an object with a "value" key ` + `representing an internal value but got: ${inspect(value)}.`);
    invariant(!value.hasOwnProperty('isDeprecated'), `${type.name}.${valueName} should provide "deprecationReason" instead of "isDeprecated".`);
    return {
      name: valueName,
      description: value.description,
      isDeprecated: Boolean(value.deprecationReason),
      deprecationReason: value.deprecationReason,
      astNode: value.astNode,
      value: value.hasOwnProperty('value') ? value.value : valueName
    };
  });
}
export function defineEnumValuesToConfig(_values)
/* <T> */
{
  const values = {};

  if (Array.isArray(_values)) {
    _values.forEach((_ref2) => {
      let name = _ref2.name,
          isDeprecated = _ref2.isDeprecated,
          config = _objectWithoutPropertiesLoose(_ref2, ["name", "isDeprecated"]);

      values[name] = config;
    });
  }

  return values;
}
export function defineInputFieldMap(config, fieldMap) {
  invariant(isPlainObj(fieldMap), `${config.name} fields must be an object with field names as keys or a ` + 'function which returns such an object.');
  const resultFieldMap = Object.create(null);

  var _arr2 = Object.keys(fieldMap);

  for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
    const fieldName = _arr2[_i2];

    const field = _objectSpread({}, fieldMap[fieldName], {
      name: fieldName
    });

    invariant(!field.hasOwnProperty('resolve'), `${config.name}.${fieldName} field has a resolve property, but ` + 'Input Types cannot define resolvers.');
    resultFieldMap[fieldName] = field;
  }

  return resultFieldMap;
}
export function defineInputFieldMapToConfig(fieldMap) {
  const fields = {};

  const _fields = resolveMaybeThunk(fieldMap);

  Object.keys(_fields).forEach(n => {
    const _fields$n2 = _fields[n],
          name = _fields$n2.name,
          isDeprecated = _fields$n2.isDeprecated,
          fc = _objectWithoutPropertiesLoose(_fields$n2, ["name", "isDeprecated"]);

    fields[n] = fc;
  });
  return fields;
}
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defineFieldMap = defineFieldMap;
exports.defineFieldMapToConfig = defineFieldMapToConfig;
exports.defineEnumValues = defineEnumValues;
exports.defineEnumValuesToConfig = defineEnumValuesToConfig;
exports.defineInputFieldMap = defineInputFieldMap;
exports.defineInputFieldMapToConfig = defineInputFieldMapToConfig;

var _invariant = _interopRequireDefault(require("graphql/jsutils/invariant"));

var _misc = require("./misc");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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

function defineFieldMap(config, fieldMap) {
  (0, _invariant.default)(isPlainObj(fieldMap), `${config.name} fields must be an object with field names as keys or a ` + 'function which returns such an object.');
  const resultFieldMap = Object.create(null);

  var _arr = Object.keys(fieldMap);

  for (var _i = 0; _i < _arr.length; _i++) {
    const fieldName = _arr[_i];
    const fieldConfig = fieldMap[fieldName];
    (0, _invariant.default)(isPlainObj(fieldConfig), `${config.name}.${fieldName} field config must be an object`);
    (0, _invariant.default)(!fieldConfig.hasOwnProperty('isDeprecated'), `${config.name}.${fieldName} should provide "deprecationReason" ` + 'instead of "isDeprecated".');

    const field = _objectSpread({}, fieldConfig, {
      isDeprecated: Boolean(fieldConfig.deprecationReason),
      name: fieldName
    });

    (0, _invariant.default)(field.resolve == null || typeof field.resolve === 'function', `${config.name}.${fieldName} field resolver must be a function if ` + `provided, but got: ${inspect(field.resolve)}.`);
    const argsConfig = fieldConfig.args;

    if (!argsConfig) {
      field.args = [];
    } else {
      (0, _invariant.default)(isPlainObj(argsConfig), `${config.name}.${fieldName} args must be an object with argument names as keys.`);
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

function defineFieldMapToConfig(fieldMap) {
  const fields = {};

  const _fields = (0, _misc.resolveMaybeThunk)(fieldMap);

  Object.keys(_fields).forEach(n => {
    const _fields$n = _fields[n],
          name = _fields$n.name,
          isDeprecated = _fields$n.isDeprecated,
          fc = _objectWithoutProperties(_fields$n, ["name", "isDeprecated"]);

    if (Array.isArray(fc.args)) {
      const args = {};
      fc.args.forEach((_ref) => {
        let argName = _ref.name,
            ac = _objectWithoutProperties(_ref, ["name"]);

        args[argName] = ac;
      });
      fc.args = args;
    }

    fields[n] = fc;
  });
  return fields;
}

function defineEnumValues(type, valueMap
/* <T> */
) {
  (0, _invariant.default)(isPlainObj(valueMap), `${type.name} values must be an object with value names as keys.`);
  return Object.keys(valueMap).map(valueName => {
    const value = valueMap[valueName];
    (0, _invariant.default)(isPlainObj(value), `${type.name}.${valueName} must refer to an object with a "value" key ` + `representing an internal value but got: ${inspect(value)}.`);
    (0, _invariant.default)(!value.hasOwnProperty('isDeprecated'), `${type.name}.${valueName} should provide "deprecationReason" instead of "isDeprecated".`);
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

function defineEnumValuesToConfig(_values)
/* <T> */
{
  const values = {};

  if (Array.isArray(_values)) {
    _values.forEach((_ref2) => {
      let name = _ref2.name,
          isDeprecated = _ref2.isDeprecated,
          config = _objectWithoutProperties(_ref2, ["name", "isDeprecated"]);

      values[name] = config;
    });
  }

  return values;
}

function defineInputFieldMap(config, fieldMap) {
  (0, _invariant.default)(isPlainObj(fieldMap), `${config.name} fields must be an object with field names as keys or a ` + 'function which returns such an object.');
  const resultFieldMap = Object.create(null);

  var _arr2 = Object.keys(fieldMap);

  for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
    const fieldName = _arr2[_i2];

    const field = _objectSpread({}, fieldMap[fieldName], {
      name: fieldName
    });

    (0, _invariant.default)(!field.hasOwnProperty('resolve'), `${config.name}.${fieldName} field has a resolve property, but ` + 'Input Types cannot define resolvers.');
    resultFieldMap[fieldName] = field;
  }

  return resultFieldMap;
}

function defineInputFieldMapToConfig(fieldMap) {
  const fields = {};

  const _fields = (0, _misc.resolveMaybeThunk)(fieldMap);

  Object.keys(_fields).forEach(n => {
    const _fields$n2 = _fields[n],
          name = _fields$n2.name,
          isDeprecated = _fields$n2.isDeprecated,
          fc = _objectWithoutProperties(_fields$n2, ["name", "isDeprecated"]);

    fields[n] = fc;
  });
  return fields;
}
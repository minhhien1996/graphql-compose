"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolveMaybeThunk = resolveMaybeThunk;
exports.camelCase = camelCase;
exports.getPluralName = getPluralName;
exports.upperFirst = upperFirst;
exports.clearName = clearName;
exports.omit = omit;
exports.only = only;
exports.inspect = inspect;

var _pluralize = _interopRequireDefault(require("./pluralize"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function resolveMaybeThunk(thingOrThunk) {
  // eslint-disable-line
  return typeof thingOrThunk === 'function' ? thingOrThunk() : thingOrThunk;
}

function camelCase(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => index === 0 ? letter.toLowerCase() : letter.toUpperCase()).replace(/\s+/g, '');
}

function getPluralName(name) {
  return (0, _pluralize.default)(camelCase(name));
}

function upperFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function clearName(str) {
  return str.replace(/[^_a-zA-Z0-9]/g, '');
}

function omit(obj, keys) {
  if (!obj) {
    return {};
  }

  const result = _objectSpread({}, obj);

  if (Array.isArray(keys)) {
    keys.forEach(k => {
      delete result[k];
    });
  } else {
    delete result[keys];
  }

  return result;
}

function only(obj, keys) {
  if (!obj) {
    return {};
  }

  const result = {};

  if (Array.isArray(keys)) {
    keys.forEach(k => {
      if ({}.hasOwnProperty.call(obj, k)) {
        result[k] = obj[k];
      }
    });
  } else if ({}.hasOwnProperty.call(obj, keys)) {
    result[keys] = obj[keys];
  }

  return result;
}
/**
 * Used to print values in error messages.
 */


function inspect(value) {
  return value && typeof value === 'object' ? typeof value.inspect === 'function' ? value.inspect() : Array.isArray(value) ? `[${value.map(inspect).join(', ')}]` : `{${Object.keys(value).map(k => `${k}: ${inspect(value[k])}`).join(', ')}}` : typeof value === 'string' ? `"${value}"` : typeof value === 'function' ? `[function ${value.name}]` : String(value);
}
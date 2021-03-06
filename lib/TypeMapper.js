"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isOutputType = isOutputType;
exports.isInputType = isInputType;
exports.TypeMapper = void 0;

var _parser = require("graphql/language/parser");

var _language = require("graphql/language");

var _buildASTSchema = require("graphql/utilities/buildASTSchema");

var _keyValMap = _interopRequireDefault(require("graphql/jsutils/keyValMap"));

var _invariant = _interopRequireDefault(require("graphql/jsutils/invariant"));

var _find = _interopRequireDefault(require("graphql/jsutils/find"));

var _values = require("graphql/execution/values");

var _graphql = require("./graphql");

var _json = _interopRequireDefault(require("./type/json"));

var _date = _interopRequireDefault(require("./type/date"));

var _buffer = _interopRequireDefault(require("./type/buffer"));

var _TypeComposer = require("./TypeComposer");

var _InputTypeComposer = require("./InputTypeComposer");

var _InterfaceTypeComposer = require("./InterfaceTypeComposer");

var _EnumTypeComposer = require("./EnumTypeComposer");

var _Resolver = require("./Resolver");

var _TypeStorage = require("./TypeStorage");

var _is = require("./utils/is");

var _default = _interopRequireDefault(require("./directive/default"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function isOutputType(type) {
  return type instanceof _graphql.GraphQLScalarType || type instanceof _graphql.GraphQLObjectType || type instanceof _graphql.GraphQLInterfaceType || type instanceof _graphql.GraphQLUnionType || type instanceof _graphql.GraphQLEnumType || type instanceof _graphql.GraphQLNonNull && isOutputType(type.ofType) || type instanceof _graphql.GraphQLList && isOutputType(type.ofType);
}

function isInputType(type) {
  return type instanceof _graphql.GraphQLScalarType || type instanceof _graphql.GraphQLEnumType || type instanceof _graphql.GraphQLInputObjectType || type instanceof _graphql.GraphQLNonNull && isInputType(type.ofType) || type instanceof _graphql.GraphQLList && isInputType(type.ofType);
}

const RegexpOutputTypeDefinition = /type\s[^{]+\{[^}]+\}/im;
const RegexpInputTypeDefinition = /input\s[^{]+\{[^}]+\}/im;
const RegexpEnumTypeDefinition = /enum\s[^{]+\{[^}]+\}/im;

class TypeMapper {
  constructor(schemaComposer) {
    _defineProperty(this, "basicScalars", new Map([// graphql basic types
    ['String', _graphql.GraphQLString], ['Float', _graphql.GraphQLFloat], ['Int', _graphql.GraphQLInt], ['Boolean', _graphql.GraphQLBoolean], ['ID', _graphql.GraphQLID]]));

    if (!schemaComposer) {
      throw new Error('TypeMapper must have SchemaComposer instance.');
    }

    this.schemaComposer = schemaComposer;
  }

  get(name) {
    const basicScalar = this.basicScalars.get(name);
    if (basicScalar) return basicScalar;

    if (!this.schemaComposer.has(name)) {
      if (name === 'JSON' || name === 'Json') {
        this.schemaComposer.set(name, _json.default);
      } else if (name === 'Date') {
        this.schemaComposer.set(name, _date.default);
      } else if (name === 'Buffer') {
        this.schemaComposer.set(name, _buffer.default);
      } else {
        return null;
      }
    }

    const schemaType = this.schemaComposer.get(name);

    if ((0, _graphql.isNamedType)(schemaType) || (0, _graphql.isScalarType)(schemaType)) {
      return schemaType;
    }

    return schemaType.getType();
  }

  set(name, type) {
    this.schemaComposer.set(name, type);
  }

  has(name) {
    return this.schemaComposer.has(name);
  }

  getWrapped(str) {
    const inputTypeAST = (0, _parser.parseType)(str);
    return typeFromAST(inputTypeAST, this.schemaComposer);
  }

  createType(str) {
    const existedType = this.get(str);
    if (existedType) return existedType;
    const astDocument = (0, _parser.parse)(str);

    if (!astDocument || astDocument.kind !== 'Document') {
      throw new Error('You should provide correct type syntax. ' + "Eg. createType('type IntRange { min: Int, max: Int }')");
    }

    const types = parseTypes(astDocument, this.schemaComposer);
    const type = types[0];

    if (type) {
      this.set(type.name, type); // Also keep type string representation for avoiding duplicates type defs for same strings

      this.set(str, type);
      return type;
    }

    return undefined;
  }

  parseTypesFromString(str) {
    const astDocument = (0, _parser.parse)(str);

    if (!astDocument || astDocument.kind !== 'Document') {
      throw new Error('You should provide correct SDL syntax.');
    }

    return this.parseTypesFromAst(astDocument);
  }

  parseTypesFromAst(astDocument) {
    const typeStorage = new _TypeStorage.TypeStorage();

    for (let i = 0; i < astDocument.definitions.length; i++) {
      const def = astDocument.definitions[i];
      const type = makeSchemaDef(def, this.schemaComposer);
      typeStorage.set(type.name, type);
    }

    return typeStorage;
  }

  convertOutputFieldConfig(composeFC, fieldName = '', typeName = '') {
    (0, _invariant.default)(composeFC, `You provide empty argument field config for ${typeName}.${fieldName}`);
    let composeType;
    let copyProps;
    let copyArgs;

    if (composeFC instanceof _graphql.GraphQLList || composeFC instanceof _graphql.GraphQLNonNull) {
      return {
        type: composeFC
      };
    } else if ((0, _is.isFunction)(composeFC)) {
      return composeFC;
    } else if (composeFC instanceof _Resolver.Resolver) {
      return composeFC.getFieldConfig();
    } else if (composeFC instanceof _TypeComposer.TypeComposer || composeFC instanceof _EnumTypeComposer.EnumTypeComposer || composeFC instanceof _InterfaceTypeComposer.InterfaceTypeComposer) {
      return {
        type: composeFC.getType(),
        description: composeFC.getDescription()
      };
    } else if (Array.isArray(composeFC)) {
      composeType = composeFC;
    } else if (composeFC.type) {
      const _ref = composeFC,
            type = _ref.type,
            args = _ref.args,
            rest = _objectWithoutProperties(_ref, ["type", "args"]);

      composeType = type;
      copyProps = rest;
      copyArgs = args;
    } else {
      composeType = composeFC;
    }

    let wrapWithList = 0;

    while (Array.isArray(composeType)) {
      if (composeType.length !== 1) {
        throw new Error(`${typeName}.${fieldName} can accept Array exact with one output type definition`);
      }

      wrapWithList += 1;
      composeType = composeType[0];
    }

    if (composeType instanceof _InputTypeComposer.InputTypeComposer) {
      throw new Error(`You cannot provide InputTypeComposer to the field '${typeName}.${fieldName}'. It should be OutputType.`);
    }

    const fieldConfig = {};

    if (typeof composeType === 'string') {
      if (RegexpInputTypeDefinition.test(composeType)) {
        throw new Error(`${typeName}.${fieldName} should be OutputType, but got input type definition '${composeType}'`);
      }

      if (this.schemaComposer.hasInstance(composeType, _TypeComposer.TypeComposer)) {
        fieldConfig.type = this.schemaComposer.getTC(composeType).getType();
      } else {
        const type = RegexpOutputTypeDefinition.test(composeType) || RegexpEnumTypeDefinition.test(composeType) ? this.createType(composeType) : this.getWrapped(composeType);

        if (!type) {
          throw new Error(`${typeName}.${fieldName} cannot convert to OutputType the following string: '${composeType}'`);
        }

        fieldConfig.type = type;
      }
    } else if (composeType instanceof _TypeComposer.TypeComposer || composeType instanceof _EnumTypeComposer.EnumTypeComposer || composeType instanceof _InterfaceTypeComposer.InterfaceTypeComposer) {
      fieldConfig.type = composeType.getType();
    } else if (composeType instanceof _Resolver.Resolver) {
      fieldConfig.type = composeType.getType();
    } else {
      fieldConfig.type = composeType;
    }

    if (!fieldConfig.type) {
      throw new Error(`${typeName}.${fieldName} must have some 'type'`);
    }

    if (!(0, _is.isFunction)(fieldConfig.type)) {
      if (!isOutputType(fieldConfig.type)) {
        throw new Error(`${typeName}.${fieldName} provided incorrect OutputType: '${JSON.stringify(composeType)}'`);
      }

      if (wrapWithList > 0) {
        for (let i = 0; i < wrapWithList; i++) {
          fieldConfig.type = new _graphql.GraphQLList(fieldConfig.type);
        }
      }
    }

    if (copyArgs) {
      const args = this.convertArgConfigMap(copyArgs, fieldName, typeName);
      fieldConfig.args = args;
    }

    if ((0, _is.isObject)(copyProps)) {
      // copy all other props
      for (const prop in copyProps) {
        if (copyProps.hasOwnProperty(prop)) {
          fieldConfig[prop] = copyProps[prop];
        }
      }
    }

    return fieldConfig;
  }

  convertOutputFieldConfigMap(composeFields, typeName = '') {
    const fields = {};
    Object.keys(composeFields).forEach(name => {
      fields[name] = this.convertOutputFieldConfig(composeFields[name], name, typeName);
    });
    return fields;
  }

  convertArgConfig(composeAC, argName = '', fieldName = '', typeName = '') {
    (0, _invariant.default)(composeAC, `You provide empty argument config for ${typeName}.${fieldName}.${argName}`);
    let composeType;
    let copyProps;

    if (composeAC instanceof _graphql.GraphQLList || composeAC instanceof _graphql.GraphQLNonNull) {
      return {
        type: composeAC
      };
    } else if (composeAC instanceof _InputTypeComposer.InputTypeComposer || composeAC instanceof _EnumTypeComposer.EnumTypeComposer) {
      return {
        type: composeAC.getType(),
        description: composeAC.getDescription()
      };
    } else if (Array.isArray(composeAC)) {
      composeType = composeAC;
    } else if ((0, _is.isFunction)(composeAC)) {
      return composeAC;
    } else if (composeAC.type) {
      const _ref2 = composeAC,
            type = _ref2.type,
            rest = _objectWithoutProperties(_ref2, ["type"]);

      composeType = type;
      copyProps = rest;
    } else {
      composeType = composeAC;
    }

    let wrapWithList = 0;

    while (Array.isArray(composeType)) {
      if (composeType.length !== 1) {
        throw new Error(`${typeName}.${fieldName}@${argName} can accept Array exact with one input type definition`);
      }

      wrapWithList += 1;
      composeType = composeType[0];
    }

    if (composeType instanceof _TypeComposer.TypeComposer) {
      throw new Error(`You cannot provide TypeComposer to the arg '${typeName}.${fieldName}.@${argName}'. It should be InputType.`);
    }

    const argConfig = {};

    if (typeof composeType === 'string') {
      if (RegexpOutputTypeDefinition.test(composeType)) {
        throw new Error(`${typeName}.${fieldName}@${argName} should be InputType, but got output type definition '${composeType}'`);
      }

      if (this.schemaComposer.hasInstance(composeType, _InputTypeComposer.InputTypeComposer)) {
        argConfig.type = this.schemaComposer.getITC(composeType).getType();
      } else {
        const type = RegexpInputTypeDefinition.test(composeType) || RegexpEnumTypeDefinition.test(composeType) ? this.createType(composeType) : this.getWrapped(composeType);

        if (!type) {
          throw new Error(`${typeName}.${fieldName}@${argName} cannot convert to InputType the following string: '${composeType}'`);
        }

        argConfig.type = type;
      }
    } else if (composeType instanceof _InputTypeComposer.InputTypeComposer || composeType instanceof _EnumTypeComposer.EnumTypeComposer) {
      argConfig.type = composeType.getType();
    } else {
      argConfig.type = composeType;
    }

    if (!argConfig.type) {
      throw new Error(`${typeName}.${fieldName}@${argName} must have some 'type'`);
    }

    if (!(0, _is.isFunction)(argConfig.type)) {
      if (!isInputType(argConfig.type)) {
        throw new Error(`${typeName}.${fieldName}@${argName} provided incorrect InputType: '${JSON.stringify(composeType)}'`);
      }

      if (wrapWithList > 0) {
        for (let i = 0; i < wrapWithList; i++) {
          argConfig.type = new _graphql.GraphQLList(argConfig.type);
        }
      }
    }

    if ((0, _is.isObject)(copyProps)) {
      // copy all other props
      for (const prop in copyProps) {
        if (copyProps.hasOwnProperty(prop)) {
          argConfig[prop] = copyProps[prop];
        }
      }
    }

    return argConfig;
  }

  convertArgConfigMap(composeArgsConfigMap, fieldName = '', typeName = '') {
    const argsConfigMap = {};

    if (composeArgsConfigMap) {
      Object.keys(composeArgsConfigMap).forEach(argName => {
        argsConfigMap[argName] = this.convertArgConfig(composeArgsConfigMap[argName], argName, fieldName, typeName);
      });
    }

    return argsConfigMap;
  }

  convertInputFieldConfig(composeIFC, fieldName = '', typeName = '') {
    (0, _invariant.default)(composeIFC, `You provide empty input field config for ${typeName}.${fieldName}`);
    let composeType;
    let copyProps;

    if (composeIFC instanceof _graphql.GraphQLList || composeIFC instanceof _graphql.GraphQLNonNull) {
      return {
        type: composeIFC
      };
    } else if (composeIFC instanceof _InputTypeComposer.InputTypeComposer || composeIFC instanceof _EnumTypeComposer.EnumTypeComposer) {
      return {
        type: composeIFC.getType(),
        description: composeIFC.getDescription()
      };
    } else if (Array.isArray(composeIFC)) {
      composeType = composeIFC;
    } else if ((0, _is.isFunction)(composeIFC)) {
      return composeIFC;
    } else if (composeIFC.type) {
      const _ref3 = composeIFC,
            type = _ref3.type,
            rest = _objectWithoutProperties(_ref3, ["type"]);

      composeType = composeIFC.type;
      copyProps = rest;
    } else {
      composeType = composeIFC;
    }

    let wrapWithList = 0;

    while (Array.isArray(composeType)) {
      if (composeType.length !== 1) {
        throw new Error(`${typeName}.${fieldName} can accept Array exact with one input type definition`);
      }

      wrapWithList += 1;
      composeType = composeType[0];
    }

    if (composeType instanceof _TypeComposer.TypeComposer) {
      throw new Error(`You cannot provide TypeComposer to the field '${typeName}.${fieldName}'. It should be InputType.`);
    }

    const fieldConfig = {};

    if (typeof composeType === 'string') {
      if (RegexpOutputTypeDefinition.test(composeType)) {
        throw new Error(`${typeName}.${fieldName} should be InputType, but got output type definition '${composeType}'`);
      }

      if (this.schemaComposer.hasInstance(composeType, _InputTypeComposer.InputTypeComposer)) {
        fieldConfig.type = this.schemaComposer.getITC(composeType).getType();
      } else {
        const type = RegexpInputTypeDefinition.test(composeType) || RegexpEnumTypeDefinition.test(composeType) ? this.createType(composeType) : this.getWrapped(composeType);

        if (!type) {
          throw new Error(`${typeName}.${fieldName} cannot convert to InputType the following string: '${composeType}'`);
        }

        fieldConfig.type = type;
      }
    } else if (composeType instanceof _InputTypeComposer.InputTypeComposer || composeType instanceof _EnumTypeComposer.EnumTypeComposer) {
      fieldConfig.type = composeType.getType();
    } else {
      fieldConfig.type = composeType;
    }

    if (!fieldConfig.type) {
      throw new Error(`${typeName}.${fieldName} must have some 'type'`);
    }

    if (!(0, _is.isFunction)(fieldConfig.type)) {
      if (!isInputType(fieldConfig.type)) {
        throw new Error(`${typeName}.${fieldName} provided incorrect InputType: '${JSON.stringify(composeType)}'`);
      }

      if (wrapWithList > 0) {
        for (let i = 0; i < wrapWithList; i++) {
          fieldConfig.type = new _graphql.GraphQLList(fieldConfig.type);
        }
      }
    }

    if ((0, _is.isObject)(copyProps)) {
      // copy all other props
      for (const prop in copyProps) {
        if (copyProps.hasOwnProperty(prop)) {
          fieldConfig[prop] = copyProps[prop];
        }
      }
    }

    return fieldConfig;
  }

  convertInputFieldConfigMap(composeFields, typeName = '') {
    const fields = {};
    Object.keys(composeFields).forEach(name => {
      fields[name] = this.convertInputFieldConfig(composeFields[name], name, typeName);
    });
    return fields;
  }

} // /////////////////////////////////////////////////////////////////////////////
// From GraphQL-js particles
// /////////////////////////////////////////////////////////////////////////////


exports.TypeMapper = TypeMapper;

function parseTypes(astDocument, schema) {
  const types = [];

  for (let i = 0; i < astDocument.definitions.length; i++) {
    const def = astDocument.definitions[i];
    types[i] = makeSchemaDef(def, schema);
  }

  return types;
}

function typeFromAST(inputTypeAST, schema) {
  let innerType;

  if (inputTypeAST.kind === _language.Kind.LIST_TYPE) {
    innerType = typeFromAST(inputTypeAST.type, schema);
    return innerType && new _graphql.GraphQLList(innerType);
  }

  if (inputTypeAST.kind === _language.Kind.NON_NULL_TYPE) {
    innerType = typeFromAST(inputTypeAST.type, schema);
    return innerType && new _graphql.GraphQLNonNull(innerType);
  }

  (0, _invariant.default)(inputTypeAST.kind === _language.Kind.NAMED_TYPE, 'Must be a named type.');
  return schema.typeMapper.get(inputTypeAST.name.value);
}

function typeDefNamed(typeName, schema) {
  const type = schema.typeMapper.get(typeName);

  if (type) {
    return type;
  }

  throw new Error(`Cannot find type with name '${typeName}' in TypeMapper.`);
}

function makeSchemaDef(def, schema) {
  if (!def) {
    throw new Error('def must be defined');
  }

  switch (def.kind) {
    case _language.Kind.OBJECT_TYPE_DEFINITION:
      return makeTypeDef(def, schema);

    case _language.Kind.INTERFACE_TYPE_DEFINITION:
      return makeInterfaceDef(def, schema);

    case _language.Kind.ENUM_TYPE_DEFINITION:
      return makeEnumDef(def);
    // case UNION_TYPE_DEFINITION:
    //   return makeUnionDef(def);
    // case SCALAR_TYPE_DEFINITION:
    //   return makeScalarDef(def);

    case _language.Kind.INPUT_OBJECT_TYPE_DEFINITION:
      return makeInputObjectDef(def, schema);

    default:
      throw new Error(`Type kind "${def.kind}" not supported.`);
  }
}

function getInputDefaultValue(value, type) {
  // check getDirectiveValues become avaliable from 0.10.2
  if (Array.isArray(value.directives) && _values.getDirectiveValues) {
    const vars = (0, _values.getDirectiveValues)(_default.default, value);
    if (vars && vars.hasOwnProperty('value')) return vars.value;
  }

  return (0, _graphql.valueFromAST)(value.defaultValue, type);
}

function makeInputValues(values, schema) {
  if (!values) return {};
  return (0, _keyValMap.default)(values, value => value.name.value, value => {
    const type = produceInputType(value.type, schema);
    return {
      type,
      description: (0, _buildASTSchema.getDescription)(value),
      defaultValue: getInputDefaultValue(value, type)
    };
  });
}

function makeFieldDefMap(def, schema) {
  if (!def.fields) return {};
  return (0, _keyValMap.default)(def.fields, field => field.name.value, field => ({
    type: produceOutputType(field.type, schema),
    description: (0, _buildASTSchema.getDescription)(field),
    args: makeInputValues(field.arguments, schema),
    deprecationReason: getDeprecationReason(field.directives),
    astNode: field
  }));
}

function makeEnumDef(def) {
  const enumType = new _graphql.GraphQLEnumType({
    name: def.name.value,
    description: (0, _buildASTSchema.getDescription)(def),
    values: !def.values ? {} : (0, _keyValMap.default)(def.values, enumValue => enumValue.name.value, enumValue => ({
      description: (0, _buildASTSchema.getDescription)(enumValue),
      deprecationReason: getDeprecationReason(enumValue.directives)
    })),
    astNode: def
  });
  return enumType;
}

function makeInputObjectDef(def, schema) {
  return new _graphql.GraphQLInputObjectType({
    name: def.name.value,
    description: (0, _buildASTSchema.getDescription)(def),
    fields: () => makeInputValues(def.fields, schema),
    astNode: def
  });
}

function getNamedTypeAST(typeAST) {
  let namedType = typeAST;

  while (namedType.kind === _language.Kind.LIST_TYPE || namedType.kind === _language.Kind.NON_NULL_TYPE) {
    namedType = namedType.type;
  }

  return namedType;
}

function buildWrappedType(innerType, inputTypeAST) {
  if (inputTypeAST.kind === _language.Kind.LIST_TYPE) {
    return new _graphql.GraphQLList(buildWrappedType(innerType, inputTypeAST.type));
  }

  if (inputTypeAST.kind === _language.Kind.NON_NULL_TYPE) {
    const wrappedType = buildWrappedType(innerType, inputTypeAST.type);
    (0, _invariant.default)(!(wrappedType instanceof _graphql.GraphQLNonNull), 'No nesting nonnull.');
    return new _graphql.GraphQLNonNull(wrappedType);
  }

  return innerType;
}

function produceOutputType(typeAST, schema) {
  const type = produceType(typeAST, schema);
  (0, _invariant.default)(isOutputType(type), 'Expected Output type.');
  return type;
}

function produceType(typeAST, schema) {
  const typeName = getNamedTypeAST(typeAST).name.value;
  const typeDef = typeDefNamed(typeName, schema);
  return buildWrappedType(typeDef, typeAST);
}

function produceInputType(typeAST, schema) {
  const type = produceType(typeAST, schema);
  (0, _invariant.default)(isInputType(type), 'Expected Input type.');
  return type;
}

function produceInterfaceType(typeAST, schema) {
  const type = produceType(typeAST, schema);
  (0, _invariant.default)(type instanceof _graphql.GraphQLInterfaceType, 'Expected Object type.');
  return type;
}

function makeImplementedInterfaces(def, schema) {
  return def.interfaces && def.interfaces.map(iface => produceInterfaceType(iface, schema));
}

function makeTypeDef(def, schema) {
  const typeName = def.name.value;
  return new _graphql.GraphQLObjectType({
    name: typeName,
    description: (0, _buildASTSchema.getDescription)(def),
    fields: () => makeFieldDefMap(def, schema),
    interfaces: () => makeImplementedInterfaces(def, schema),
    astNode: def
  });
}

function makeInterfaceDef(def, schema) {
  const typeName = def.name.value;
  return new _graphql.GraphQLInterfaceType({
    name: typeName,
    description: (0, _buildASTSchema.getDescription)(def),
    fields: () => makeFieldDefMap(def, schema),
    astNode: def
  });
}

function getDeprecationReason(directives) {
  const deprecatedAST = directives && (0, _find.default)(directives, directive => directive.name.value === _graphql.GraphQLDeprecatedDirective.name);

  if (!deprecatedAST) {
    return;
  }

  const _getArgumentValues = (0, _values.getArgumentValues)(_graphql.GraphQLDeprecatedDirective, deprecatedAST),
        reason = _getArgumentValues.reason;

  return reason; // eslint-disable-line
}
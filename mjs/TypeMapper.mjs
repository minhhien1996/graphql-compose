function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*  strict */

/* eslint-disable no-use-before-define, class-methods-use-this, no-unused-vars, no-param-reassign */
import { parse, parseType } from 'graphql/language/parser';
import { Kind } from 'graphql/language';
import { getDescription } from 'graphql/utilities/buildASTSchema';
import keyValMap from 'graphql/jsutils/keyValMap';
import invariant from 'graphql/jsutils/invariant';
import find from 'graphql/jsutils/find';
import { getArgumentValues, getDirectiveValues } from 'graphql/execution/values';
import { GraphQLInt, GraphQLFloat, GraphQLString, GraphQLBoolean, GraphQLScalarType, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLEnumType, GraphQLObjectType, GraphQLInputObjectType, GraphQLInterfaceType, GraphQLDirective, GraphQLSkipDirective, GraphQLIncludeDirective, GraphQLDeprecatedDirective, GraphQLUnionType, // isOutputType,
// isInputType,
isNamedType, isScalarType, valueFromAST } from './graphql';
import GraphQLJSON from './type/json';
import GraphQLDate from './type/date';
import GraphQLBuffer from './type/buffer';
import { TypeComposer } from './TypeComposer';
import { InputTypeComposer } from './InputTypeComposer';
import { InterfaceTypeComposer } from './InterfaceTypeComposer';
import { EnumTypeComposer } from './EnumTypeComposer';
import { Resolver } from './Resolver';
import { TypeStorage } from './TypeStorage';
import { isFunction, isObject } from './utils/is';
import DefaultDirective from './directive/default';
export function isOutputType(type) {
  return type instanceof GraphQLScalarType || type instanceof GraphQLObjectType || type instanceof GraphQLInterfaceType || type instanceof GraphQLUnionType || type instanceof GraphQLEnumType || type instanceof GraphQLNonNull && isOutputType(type.ofType) || type instanceof GraphQLList && isOutputType(type.ofType);
}
export function isInputType(type) {
  return type instanceof GraphQLScalarType || type instanceof GraphQLEnumType || type instanceof GraphQLInputObjectType || type instanceof GraphQLNonNull && isInputType(type.ofType) || type instanceof GraphQLList && isInputType(type.ofType);
}
const RegexpOutputTypeDefinition = /type\s[^{]+\{[^}]+\}/im;
const RegexpInputTypeDefinition = /input\s[^{]+\{[^}]+\}/im;
const RegexpEnumTypeDefinition = /enum\s[^{]+\{[^}]+\}/im;
export class TypeMapper {
  constructor(schemaComposer) {
    _defineProperty(this, "basicScalars", new Map([// graphql basic types
    ['String', GraphQLString], ['Float', GraphQLFloat], ['Int', GraphQLInt], ['Boolean', GraphQLBoolean], ['ID', GraphQLID]]));

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
        this.schemaComposer.set(name, GraphQLJSON);
      } else if (name === 'Date') {
        this.schemaComposer.set(name, GraphQLDate);
      } else if (name === 'Buffer') {
        this.schemaComposer.set(name, GraphQLBuffer);
      } else {
        return null;
      }
    }

    const schemaType = this.schemaComposer.get(name);

    if (isNamedType(schemaType) || isScalarType(schemaType)) {
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
    const inputTypeAST = parseType(str);
    return typeFromAST(inputTypeAST, this.schemaComposer);
  }

  createType(str) {
    const existedType = this.get(str);
    if (existedType) return existedType;
    const astDocument = parse(str);

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
    const astDocument = parse(str);

    if (!astDocument || astDocument.kind !== 'Document') {
      throw new Error('You should provide correct SDL syntax.');
    }

    return this.parseTypesFromAst(astDocument);
  }

  parseTypesFromAst(astDocument) {
    const typeStorage = new TypeStorage();

    for (let i = 0; i < astDocument.definitions.length; i++) {
      const def = astDocument.definitions[i];
      const type = makeSchemaDef(def, this.schemaComposer);
      typeStorage.set(type.name, type);
    }

    return typeStorage;
  }

  convertOutputFieldConfig(composeFC, fieldName = '', typeName = '') {
    invariant(composeFC, `You provide empty argument field config for ${typeName}.${fieldName}`);
    let composeType;
    let copyProps;
    let copyArgs;

    if (composeFC instanceof GraphQLList || composeFC instanceof GraphQLNonNull) {
      return {
        type: composeFC
      };
    } else if (isFunction(composeFC)) {
      return composeFC;
    } else if (composeFC instanceof Resolver) {
      return composeFC.getFieldConfig();
    } else if (composeFC instanceof TypeComposer || composeFC instanceof EnumTypeComposer || composeFC instanceof InterfaceTypeComposer) {
      return {
        type: composeFC.getType(),
        description: composeFC.getDescription()
      };
    } else if (Array.isArray(composeFC)) {
      composeType = composeFC;
    } else if (composeFC.type) {
      const _ref = composeFC,
            {
        type,
        args
      } = _ref,
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

    if (composeType instanceof InputTypeComposer) {
      throw new Error(`You cannot provide InputTypeComposer to the field '${typeName}.${fieldName}'. It should be OutputType.`);
    }

    const fieldConfig = {};

    if (typeof composeType === 'string') {
      if (RegexpInputTypeDefinition.test(composeType)) {
        throw new Error(`${typeName}.${fieldName} should be OutputType, but got input type definition '${composeType}'`);
      }

      if (this.schemaComposer.hasInstance(composeType, TypeComposer)) {
        fieldConfig.type = this.schemaComposer.getTC(composeType).getType();
      } else {
        const type = RegexpOutputTypeDefinition.test(composeType) || RegexpEnumTypeDefinition.test(composeType) ? this.createType(composeType) : this.getWrapped(composeType);

        if (!type) {
          throw new Error(`${typeName}.${fieldName} cannot convert to OutputType the following string: '${composeType}'`);
        }

        fieldConfig.type = type;
      }
    } else if (composeType instanceof TypeComposer || composeType instanceof EnumTypeComposer || composeType instanceof InterfaceTypeComposer) {
      fieldConfig.type = composeType.getType();
    } else if (composeType instanceof Resolver) {
      fieldConfig.type = composeType.getType();
    } else {
      fieldConfig.type = composeType;
    }

    if (!fieldConfig.type) {
      throw new Error(`${typeName}.${fieldName} must have some 'type'`);
    }

    if (!isFunction(fieldConfig.type)) {
      if (!isOutputType(fieldConfig.type)) {
        throw new Error(`${typeName}.${fieldName} provided incorrect OutputType: '${JSON.stringify(composeType)}'`);
      }

      if (wrapWithList > 0) {
        for (let i = 0; i < wrapWithList; i++) {
          fieldConfig.type = new GraphQLList(fieldConfig.type);
        }
      }
    }

    if (copyArgs) {
      const args = this.convertArgConfigMap(copyArgs, fieldName, typeName);
      fieldConfig.args = args;
    }

    if (isObject(copyProps)) {
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
    invariant(composeAC, `You provide empty argument config for ${typeName}.${fieldName}.${argName}`);
    let composeType;
    let copyProps;

    if (composeAC instanceof GraphQLList || composeAC instanceof GraphQLNonNull) {
      return {
        type: composeAC
      };
    } else if (composeAC instanceof InputTypeComposer || composeAC instanceof EnumTypeComposer) {
      return {
        type: composeAC.getType(),
        description: composeAC.getDescription()
      };
    } else if (Array.isArray(composeAC)) {
      composeType = composeAC;
    } else if (isFunction(composeAC)) {
      return composeAC;
    } else if (composeAC.type) {
      const _ref2 = composeAC,
            {
        type
      } = _ref2,
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

    if (composeType instanceof TypeComposer) {
      throw new Error(`You cannot provide TypeComposer to the arg '${typeName}.${fieldName}.@${argName}'. It should be InputType.`);
    }

    const argConfig = {};

    if (typeof composeType === 'string') {
      if (RegexpOutputTypeDefinition.test(composeType)) {
        throw new Error(`${typeName}.${fieldName}@${argName} should be InputType, but got output type definition '${composeType}'`);
      }

      if (this.schemaComposer.hasInstance(composeType, InputTypeComposer)) {
        argConfig.type = this.schemaComposer.getITC(composeType).getType();
      } else {
        const type = RegexpInputTypeDefinition.test(composeType) || RegexpEnumTypeDefinition.test(composeType) ? this.createType(composeType) : this.getWrapped(composeType);

        if (!type) {
          throw new Error(`${typeName}.${fieldName}@${argName} cannot convert to InputType the following string: '${composeType}'`);
        }

        argConfig.type = type;
      }
    } else if (composeType instanceof InputTypeComposer || composeType instanceof EnumTypeComposer) {
      argConfig.type = composeType.getType();
    } else {
      argConfig.type = composeType;
    }

    if (!argConfig.type) {
      throw new Error(`${typeName}.${fieldName}@${argName} must have some 'type'`);
    }

    if (!isFunction(argConfig.type)) {
      if (!isInputType(argConfig.type)) {
        throw new Error(`${typeName}.${fieldName}@${argName} provided incorrect InputType: '${JSON.stringify(composeType)}'`);
      }

      if (wrapWithList > 0) {
        for (let i = 0; i < wrapWithList; i++) {
          argConfig.type = new GraphQLList(argConfig.type);
        }
      }
    }

    if (isObject(copyProps)) {
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
    invariant(composeIFC, `You provide empty input field config for ${typeName}.${fieldName}`);
    let composeType;
    let copyProps;

    if (composeIFC instanceof GraphQLList || composeIFC instanceof GraphQLNonNull) {
      return {
        type: composeIFC
      };
    } else if (composeIFC instanceof InputTypeComposer || composeIFC instanceof EnumTypeComposer) {
      return {
        type: composeIFC.getType(),
        description: composeIFC.getDescription()
      };
    } else if (Array.isArray(composeIFC)) {
      composeType = composeIFC;
    } else if (isFunction(composeIFC)) {
      return composeIFC;
    } else if (composeIFC.type) {
      const _ref3 = composeIFC,
            {
        type
      } = _ref3,
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

    if (composeType instanceof TypeComposer) {
      throw new Error(`You cannot provide TypeComposer to the field '${typeName}.${fieldName}'. It should be InputType.`);
    }

    const fieldConfig = {};

    if (typeof composeType === 'string') {
      if (RegexpOutputTypeDefinition.test(composeType)) {
        throw new Error(`${typeName}.${fieldName} should be InputType, but got output type definition '${composeType}'`);
      }

      if (this.schemaComposer.hasInstance(composeType, InputTypeComposer)) {
        fieldConfig.type = this.schemaComposer.getITC(composeType).getType();
      } else {
        const type = RegexpInputTypeDefinition.test(composeType) || RegexpEnumTypeDefinition.test(composeType) ? this.createType(composeType) : this.getWrapped(composeType);

        if (!type) {
          throw new Error(`${typeName}.${fieldName} cannot convert to InputType the following string: '${composeType}'`);
        }

        fieldConfig.type = type;
      }
    } else if (composeType instanceof InputTypeComposer || composeType instanceof EnumTypeComposer) {
      fieldConfig.type = composeType.getType();
    } else {
      fieldConfig.type = composeType;
    }

    if (!fieldConfig.type) {
      throw new Error(`${typeName}.${fieldName} must have some 'type'`);
    }

    if (!isFunction(fieldConfig.type)) {
      if (!isInputType(fieldConfig.type)) {
        throw new Error(`${typeName}.${fieldName} provided incorrect InputType: '${JSON.stringify(composeType)}'`);
      }

      if (wrapWithList > 0) {
        for (let i = 0; i < wrapWithList; i++) {
          fieldConfig.type = new GraphQLList(fieldConfig.type);
        }
      }
    }

    if (isObject(copyProps)) {
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

  if (inputTypeAST.kind === Kind.LIST_TYPE) {
    innerType = typeFromAST(inputTypeAST.type, schema);
    return innerType && new GraphQLList(innerType);
  }

  if (inputTypeAST.kind === Kind.NON_NULL_TYPE) {
    innerType = typeFromAST(inputTypeAST.type, schema);
    return innerType && new GraphQLNonNull(innerType);
  }

  invariant(inputTypeAST.kind === Kind.NAMED_TYPE, 'Must be a named type.');
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
    case Kind.OBJECT_TYPE_DEFINITION:
      return makeTypeDef(def, schema);

    case Kind.INTERFACE_TYPE_DEFINITION:
      return makeInterfaceDef(def, schema);

    case Kind.ENUM_TYPE_DEFINITION:
      return makeEnumDef(def);
    // case UNION_TYPE_DEFINITION:
    //   return makeUnionDef(def);
    // case SCALAR_TYPE_DEFINITION:
    //   return makeScalarDef(def);

    case Kind.INPUT_OBJECT_TYPE_DEFINITION:
      return makeInputObjectDef(def, schema);

    default:
      throw new Error(`Type kind "${def.kind}" not supported.`);
  }
}

function getInputDefaultValue(value, type) {
  // check getDirectiveValues become avaliable from 0.10.2
  if (Array.isArray(value.directives) && getDirectiveValues) {
    const vars = getDirectiveValues(DefaultDirective, value);
    if (vars && vars.hasOwnProperty('value')) return vars.value;
  }

  return valueFromAST(value.defaultValue, type);
}

function makeInputValues(values, schema) {
  if (!values) return {};
  return keyValMap(values, value => value.name.value, value => {
    const type = produceInputType(value.type, schema);
    return {
      type,
      description: getDescription(value),
      defaultValue: getInputDefaultValue(value, type)
    };
  });
}

function makeFieldDefMap(def, schema) {
  if (!def.fields) return {};
  return keyValMap(def.fields, field => field.name.value, field => ({
    type: produceOutputType(field.type, schema),
    description: getDescription(field),
    args: makeInputValues(field.arguments, schema),
    deprecationReason: getDeprecationReason(field.directives),
    astNode: field
  }));
}

function makeEnumDef(def) {
  const enumType = new GraphQLEnumType({
    name: def.name.value,
    description: getDescription(def),
    values: !def.values ? {} : keyValMap(def.values, enumValue => enumValue.name.value, enumValue => ({
      description: getDescription(enumValue),
      deprecationReason: getDeprecationReason(enumValue.directives)
    })),
    astNode: def
  });
  return enumType;
}

function makeInputObjectDef(def, schema) {
  return new GraphQLInputObjectType({
    name: def.name.value,
    description: getDescription(def),
    fields: () => makeInputValues(def.fields, schema),
    astNode: def
  });
}

function getNamedTypeAST(typeAST) {
  let namedType = typeAST;

  while (namedType.kind === Kind.LIST_TYPE || namedType.kind === Kind.NON_NULL_TYPE) {
    namedType = namedType.type;
  }

  return namedType;
}

function buildWrappedType(innerType, inputTypeAST) {
  if (inputTypeAST.kind === Kind.LIST_TYPE) {
    return new GraphQLList(buildWrappedType(innerType, inputTypeAST.type));
  }

  if (inputTypeAST.kind === Kind.NON_NULL_TYPE) {
    const wrappedType = buildWrappedType(innerType, inputTypeAST.type);
    invariant(!(wrappedType instanceof GraphQLNonNull), 'No nesting nonnull.');
    return new GraphQLNonNull(wrappedType);
  }

  return innerType;
}

function produceOutputType(typeAST, schema) {
  const type = produceType(typeAST, schema);
  invariant(isOutputType(type), 'Expected Output type.');
  return type;
}

function produceType(typeAST, schema) {
  const typeName = getNamedTypeAST(typeAST).name.value;
  const typeDef = typeDefNamed(typeName, schema);
  return buildWrappedType(typeDef, typeAST);
}

function produceInputType(typeAST, schema) {
  const type = produceType(typeAST, schema);
  invariant(isInputType(type), 'Expected Input type.');
  return type;
}

function produceInterfaceType(typeAST, schema) {
  const type = produceType(typeAST, schema);
  invariant(type instanceof GraphQLInterfaceType, 'Expected Object type.');
  return type;
}

function makeImplementedInterfaces(def, schema) {
  return def.interfaces && def.interfaces.map(iface => produceInterfaceType(iface, schema));
}

function makeTypeDef(def, schema) {
  const typeName = def.name.value;
  return new GraphQLObjectType({
    name: typeName,
    description: getDescription(def),
    fields: () => makeFieldDefMap(def, schema),
    interfaces: () => makeImplementedInterfaces(def, schema),
    astNode: def
  });
}

function makeInterfaceDef(def, schema) {
  const typeName = def.name.value;
  return new GraphQLInterfaceType({
    name: typeName,
    description: getDescription(def),
    fields: () => makeFieldDefMap(def, schema),
    astNode: def
  });
}

function getDeprecationReason(directives) {
  const deprecatedAST = directives && find(directives, directive => directive.name.value === GraphQLDeprecatedDirective.name);

  if (!deprecatedAST) {
    return;
  }

  const {
    reason
  } = getArgumentValues(GraphQLDeprecatedDirective, deprecatedAST);
  return reason; // eslint-disable-line
}
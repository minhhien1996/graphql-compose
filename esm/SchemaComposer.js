function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*  strict */

/* eslint-disable class-methods-use-this */
import { TypeStorage } from './TypeStorage';
import { TypeMapper } from './TypeMapper';
import { TypeComposer as _TypeComposer } from './TypeComposer';
import { InputTypeComposer as _InputTypeComposer } from './InputTypeComposer';
import { EnumTypeComposer as _EnumTypeComposer } from './EnumTypeComposer';
import { InterfaceTypeComposer as _InterfaceTypeComposer } from './InterfaceTypeComposer';
import { Resolver as _Resolver } from './Resolver';
import { isFunction } from './utils/is';
import { getGraphQLType } from './utils/typeHelpers';
import { GraphQLSchema, GraphQLObjectType, GraphQLInputObjectType, GraphQLInterfaceType, GraphQLEnumType } from './graphql';
export class SchemaComposer extends TypeStorage {
  constructor() {
    super();

    _defineProperty(this, "_schemaMustHaveTypes", []);

    const schema = this;

    class TypeComposer extends _TypeComposer {}

    _defineProperty(TypeComposer, "schemaComposer", schema);

    this.TypeComposer = TypeComposer;

    class InputTypeComposer extends _InputTypeComposer {}

    _defineProperty(InputTypeComposer, "schemaComposer", schema);

    this.InputTypeComposer = InputTypeComposer;

    class Resolver extends _Resolver {}

    _defineProperty(Resolver, "schemaComposer", schema);

    this.Resolver = Resolver;

    class EnumTypeComposer extends _EnumTypeComposer {}

    _defineProperty(EnumTypeComposer, "schemaComposer", schema);

    this.EnumTypeComposer = EnumTypeComposer;

    class InterfaceTypeComposer extends _InterfaceTypeComposer {}

    _defineProperty(InterfaceTypeComposer, "schemaComposer", schema);

    this.InterfaceTypeComposer = InterfaceTypeComposer;
    this.typeMapper = new TypeMapper(schema); // alive proper Flow type casting in autosuggestions

    /* :: return this; */
  }

  get Query() {
    return this.rootQuery();
  }

  rootQuery() {
    return this.getOrCreateTC('Query');
  }

  get Mutation() {
    return this.rootMutation();
  }

  rootMutation() {
    return this.getOrCreateTC('Mutation');
  }

  get Subscription() {
    return this.rootSubscription();
  }

  rootSubscription() {
    return this.getOrCreateTC('Subscription');
  }

  buildSchema(extraConfig) {
    const roots = {};

    if (this.has('Query')) {
      const tc = this.getTC('Query');
      this.removeEmptyTypes(tc, new Set());
      roots.query = tc.getType();
    }

    if (this.has('Mutation')) {
      const tc = this.getTC('Mutation');
      this.removeEmptyTypes(tc, new Set());
      roots.mutation = tc.getType();
    }

    if (this.has('Subscription')) {
      const tc = this.getTC('Subscription');
      this.removeEmptyTypes(tc, new Set());
      roots.subscription = tc.getType();
    }

    if (!roots.query) {
      throw new Error('Can not build schema. Must be initialized Query type. See https://github.com/graphql/graphql-js/issues/448');
    }

    if (Object.keys(roots).length === 0) {
      throw new Error('Can not build schema. Must be initialized at least one ' + 'of the following types: Query, Mutation, Subscription.');
    }

    const types = [...this._schemaMustHaveTypes.map(t => getGraphQLType(t)), // additional types, eg. used in Interfaces
    ...(extraConfig && Array.isArray(extraConfig.types) ? [...extraConfig.types] : [])];
    return new GraphQLSchema(_objectSpread({}, roots, extraConfig, {
      types
    }));
  }

  addSchemaMustHaveType(type) {
    this._schemaMustHaveTypes.push(type);

    return this;
  }

  removeEmptyTypes(typeComposer, passedTypes = new Set()) {
    typeComposer.getFieldNames().forEach(fieldName => {
      const fieldType = typeComposer.getFieldType(fieldName);

      if (fieldType instanceof GraphQLObjectType) {
        const typeName = fieldType.name;

        if (!passedTypes.has(typeName)) {
          passedTypes.add(typeName);
          const tc = new this.TypeComposer(fieldType);

          if (Object.keys(tc.getFields()).length > 0) {
            this.removeEmptyTypes(tc, passedTypes);
          } else {
            // eslint-disable-next-line
            console.log(`graphql-compose: Delete field '${typeComposer.getTypeName()}.${fieldName}' ` + `with type '${tc.getTypeName()}', cause it does not have fields.`);
            typeComposer.removeField(fieldName);
          }
        }
      }
    });
  }

  getOrCreateTC(typeName, onCreate) {
    try {
      return this.getTC(typeName);
    } catch (e) {
      const tc = this.TypeComposer.create(typeName);
      this.set(typeName, tc);
      if (onCreate && isFunction(onCreate)) onCreate(tc);
      return tc;
    }
  }

  getOrCreateITC(typeName, onCreate) {
    try {
      return this.getITC(typeName);
    } catch (e) {
      const itc = this.InputTypeComposer.create(typeName);
      this.set(typeName, itc);
      if (onCreate && isFunction(onCreate)) onCreate(itc);
      return itc;
    }
  }

  getOrCreateETC(typeName, onCreate) {
    try {
      return this.getETC(typeName);
    } catch (e) {
      const etc = this.EnumTypeComposer.create(typeName);
      this.set(typeName, etc);
      if (onCreate && isFunction(onCreate)) onCreate(etc);
      return etc;
    }
  }

  getOrCreateIFTC(typeName, onCreate) {
    try {
      return this.getIFTC(typeName);
    } catch (e) {
      const iftc = this.InterfaceTypeComposer.create(typeName);
      this.set(typeName, iftc);
      if (onCreate && isFunction(onCreate)) onCreate(iftc);
      return iftc;
    }
  } // disable redundant noise in console.logs


  toString() {
    return 'SchemaComposer';
  }

  toJSON() {
    return 'SchemaComposer';
  }

  inspect() {
    return 'SchemaComposer';
  }

  clear() {
    super.clear();
    this._schemaMustHaveTypes = [];
  }

  getTC(typeName) {
    if (this.hasInstance(typeName, GraphQLObjectType)) {
      return this.TypeComposer.create(this.get(typeName));
    }

    return super.getTC(typeName);
  }

  getITC(typeName) {
    if (this.hasInstance(typeName, GraphQLInputObjectType)) {
      return this.InputTypeComposer.create(this.get(typeName));
    }

    return super.getITC(typeName);
  }

  getETC(typeName) {
    if (this.hasInstance(typeName, GraphQLEnumType)) {
      return this.EnumTypeComposer.create(this.get(typeName));
    }

    return super.getETC(typeName);
  }

  getIFTC(typeName) {
    if (this.hasInstance(typeName, GraphQLInterfaceType)) {
      return this.InterfaceTypeComposer.create(this.get(typeName));
    }

    return super.getIFTC(typeName);
  }

  addTypeDefs(typeDefs) {
    const types = this.typeMapper.parseTypesFromString(typeDefs);
    types.forEach(type => {
      this.add(type);
    });
    return types;
  }

  addResolveMethods(typesFieldsResolve) {
    const typeNames = Object.keys(typesFieldsResolve);
    typeNames.forEach(typeName => {
      const tc = this.getTC(typeName);
      const fieldsResolve = typesFieldsResolve[typeName];
      const fieldNames = Object.keys(fieldsResolve);
      fieldNames.forEach(fieldName => {
        tc.extendField(fieldName, {
          resolve: fieldsResolve[fieldName]
        });
      });
    });
  }

}
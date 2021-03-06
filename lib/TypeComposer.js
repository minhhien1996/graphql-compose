"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TypeComposer = void 0;

var _graphql = require("./graphql");

var _InterfaceTypeComposer = require("./InterfaceTypeComposer");

var _Resolver = require("./Resolver");

var _misc = require("./utils/misc");

var _is = require("./utils/is");

var _configAsThunk = require("./utils/configAsThunk");

var _configToDefine = require("./utils/configToDefine");

var _toInputObjectType = require("./utils/toInputObjectType");

var _typeByPath = require("./utils/typeByPath");

var _graphqlVersion = require("./utils/graphqlVersion");

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class TypeComposer {
  get schemaComposer() {
    return this.constructor.schemaComposer;
  }

  static create(opts) {
    const tc = this.createTemp(opts);
    const typeName = tc.getTypeName();

    if (typeName !== 'Query' && typeName !== 'Mutation' && typeName !== 'Subscription') {
      this.schemaComposer.add(tc);
    }

    return tc;
  }

  static createTemp(opts) {
    if (!this.schemaComposer) {
      throw new Error('Class<TypeComposer> must be created by a SchemaComposer.');
    }

    let TC;

    if ((0, _is.isString)(opts)) {
      const typeName = opts;
      const NAME_RX = /^[_a-zA-Z][_a-zA-Z0-9]*$/;

      if (NAME_RX.test(typeName)) {
        TC = new this.schemaComposer.TypeComposer(new _graphql.GraphQLObjectType({
          name: typeName,
          fields: () => ({})
        }));
      } else {
        const type = this.schemaComposer.typeMapper.createType(typeName);

        if (!(type instanceof _graphql.GraphQLObjectType)) {
          throw new Error('You should provide correct GraphQLObjectType type definition.' + 'Eg. `type MyType { name: String }`');
        }

        TC = new this.schemaComposer.TypeComposer(type);
      }
    } else if (opts instanceof _graphql.GraphQLObjectType) {
      TC = new this.schemaComposer.TypeComposer(opts);
    } else if ((0, _is.isObject)(opts)) {
      const fields = opts.fields;
      const type = new _graphql.GraphQLObjectType(_objectSpread({}, opts, {
        fields: (0, _is.isFunction)(fields) ? () => (0, _configAsThunk.resolveOutputConfigMapAsThunk)(this.schemaComposer, fields(), opts.name) : () => ({})
      }));
      TC = new this.schemaComposer.TypeComposer(type);
      if ((0, _is.isObject)(fields)) TC.addFields(fields);
    } else {
      throw new Error('You should provide GraphQLObjectTypeConfig or string with type name to TypeComposer.create(opts)');
    }

    return TC;
  }

  constructor(gqType) {
    if (!this.schemaComposer) {
      throw new Error('Class<TypeComposer> can only be created by a SchemaComposer.');
    }

    if (!(gqType instanceof _graphql.GraphQLObjectType)) {
      throw new Error('TypeComposer accept only GraphQLObjectType in constructor');
    }

    this.gqType = gqType; // Alive proper Flow type casting in autosuggestions for class with Generics
    // it's required due using <TContext>
    // and Class<> utility type in SchemaComposer

    /* :: return this; */
  } // -----------------------------------------------
  // Field methods
  // -----------------------------------------------


  getFields() {
    if (!this.gqType._gqcFields) {
      if (_graphqlVersion.graphqlVersion >= 14) {
        this.gqType._gqcFields = (0, _configToDefine.defineFieldMapToConfig)(this.gqType._fields);
      } else {
        // $FlowFixMe
        const fields = this.gqType._typeConfig.fields;
        this.gqType._gqcFields = (0, _misc.resolveMaybeThunk)(fields) || {};
      }
    }

    return this.gqType._gqcFields;
  }

  getFieldNames() {
    return Object.keys(this.getFields());
  }

  setFields(fields) {
    this.gqType._gqcFields = fields;

    if (_graphqlVersion.graphqlVersion >= 14) {
      this.gqType._fields = () => {
        return (0, _configToDefine.defineFieldMap)(this.gqType, (0, _configAsThunk.resolveOutputConfigMapAsThunk)(this.schemaComposer, fields, this.getTypeName()));
      };
    } else {
      // $FlowFixMe
      this.gqType._typeConfig.fields = () => {
        return (0, _configAsThunk.resolveOutputConfigMapAsThunk)(this.schemaComposer, fields, this.getTypeName());
      };

      delete this.gqType._fields; // clear builded fields in type
    }

    return this;
  }

  hasField(fieldName) {
    const fields = this.getFields();
    return !!fields[fieldName];
  }

  setField(fieldName, fieldConfig) {
    this.addFields({
      [fieldName]: fieldConfig
    });
    return this;
  }
  /**
   * Add new fields or replace existed in a GraphQL type
   */


  addFields(newFields) {
    this.setFields(_objectSpread({}, this.getFields(), newFields));
    return this;
  }
  /**
   * Add new fields or replace existed (where field name may have dots)
   */


  addNestedFields(newFields) {
    Object.keys(newFields).forEach(fieldName => {
      const fc = newFields[fieldName];
      const names = fieldName.split('.');
      const name = names.shift();

      if (names.length === 0) {
        // single field
        this.setField(name, fc);
      } else {
        // nested field
        let childTC;

        if (!this.hasField(name)) {
          childTC = this.schemaComposer.TypeComposer.createTemp(`${this.getTypeName()}${(0, _misc.upperFirst)(name)}`);
          this.setField(name, {
            type: childTC,
            resolve: () => ({})
          });
        } else {
          childTC = this.getFieldTC(name);
        }

        childTC.addNestedFields({
          [names.join('.')]: fc
        });
      }
    });
    return this;
  }
  /**
   * Get fieldConfig by name
   */


  getField(fieldName) {
    const fields = this.getFields();

    if (!fields[fieldName]) {
      throw new Error(`Cannot get field '${fieldName}' from type '${this.getTypeName()}'. Field does not exist.`);
    }

    return fields[fieldName];
  }

  removeField(fieldNameOrArray) {
    const fieldNames = Array.isArray(fieldNameOrArray) ? fieldNameOrArray : [fieldNameOrArray];
    const fields = this.getFields();
    fieldNames.forEach(fieldName => delete fields[fieldName]);
    this.setFields(_objectSpread({}, fields));
    return this;
  }

  removeOtherFields(fieldNameOrArray) {
    const keepFieldNames = Array.isArray(fieldNameOrArray) ? fieldNameOrArray : [fieldNameOrArray];
    const fields = this.getFields();
    Object.keys(fields).forEach(fieldName => {
      if (keepFieldNames.indexOf(fieldName) === -1) {
        delete fields[fieldName];
      }
    });
    this.setFields(fields);
    return this;
  }

  extendField(fieldName, parialFieldConfig) {
    let prevFieldConfig;

    try {
      prevFieldConfig = this.getFieldConfig(fieldName);
    } catch (e) {
      throw new Error(`Cannot extend field '${fieldName}' from type '${this.getTypeName()}'. Field does not exist.`);
    }

    this.setField(fieldName, _objectSpread({}, prevFieldConfig, parialFieldConfig));
    return this;
  }

  reorderFields(names) {
    const orderedFields = {};
    const fields = this.getFields();
    names.forEach(name => {
      if (fields[name]) {
        orderedFields[name] = fields[name];
        delete fields[name];
      }
    });
    this.setFields(_objectSpread({}, orderedFields, fields));
    return this;
  }

  isFieldNonNull(fieldName) {
    return this.getFieldType(fieldName) instanceof _graphql.GraphQLNonNull;
  }

  getFieldConfig(fieldName) {
    const fc = this.getField(fieldName);

    if (!fc) {
      throw new Error(`Type ${this.getTypeName()} does not have field with name '${fieldName}'`);
    }

    return (0, _configAsThunk.resolveOutputConfigAsThunk)(this.schemaComposer, fc, fieldName, this.getTypeName());
  }

  getFieldType(fieldName) {
    return this.getFieldConfig(fieldName).type;
  }

  getFieldTC(fieldName) {
    const fieldType = (0, _graphql.getNamedType)(this.getFieldType(fieldName));

    if (!(fieldType instanceof _graphql.GraphQLObjectType)) {
      throw new Error(`Cannot get TypeComposer for field '${fieldName}' in type ${this.getTypeName()}. ` + `This field should be ObjectType, but it has type '${fieldType.constructor.name}'`);
    }

    return this.schemaComposer.TypeComposer.createTemp(fieldType);
  }

  makeFieldNonNull(fieldNameOrArray) {
    const fieldNames = Array.isArray(fieldNameOrArray) ? fieldNameOrArray : [fieldNameOrArray];
    fieldNames.forEach(fieldName => {
      if (this.hasField(fieldName)) {
        const fieldType = this.getFieldType(fieldName);

        if (!(fieldType instanceof _graphql.GraphQLNonNull)) {
          this.extendField(fieldName, {
            type: new _graphql.GraphQLNonNull(fieldType)
          });
        }
      }
    });
    return this;
  }

  makeFieldNullable(fieldNameOrArray) {
    const fieldNames = Array.isArray(fieldNameOrArray) ? fieldNameOrArray : [fieldNameOrArray];
    fieldNames.forEach(fieldName => {
      if (this.hasField(fieldName)) {
        const fieldType = this.getFieldType(fieldName);

        if (fieldType instanceof _graphql.GraphQLNonNull) {
          this.extendField(fieldName, {
            type: fieldType.ofType
          });
        }
      }
    });
    return this;
  }

  deprecateFields(fields) {
    const existedFieldNames = this.getFieldNames();

    if (typeof fields === 'string') {
      if (existedFieldNames.indexOf(fields) === -1) {
        throw new Error(`Cannot deprecate unexisted field '${fields}' from type '${this.getTypeName()}'`);
      }

      this.extendField(fields, {
        deprecationReason: 'deprecated'
      });
    } else if (Array.isArray(fields)) {
      fields.forEach(field => {
        if (existedFieldNames.indexOf(field) === -1) {
          throw new Error(`Cannot deprecate unexisted field '${field}' from type '${this.getTypeName()}'`);
        }

        this.extendField(field, {
          deprecationReason: 'deprecated'
        });
      });
    } else {
      const fieldMap = fields;
      Object.keys(fieldMap).forEach(field => {
        if (existedFieldNames.indexOf(field) === -1) {
          throw new Error(`Cannot deprecate unexisted field '${field}' from type '${this.getTypeName()}'`);
        }

        const deprecationReason = fieldMap[field];
        this.extendField(field, {
          deprecationReason
        });
      });
    }

    return this;
  }

  getFieldArgs(fieldName) {
    try {
      const fc = this.getFieldConfig(fieldName);
      return fc.args || {};
    } catch (e) {
      throw new Error(`Cannot get field args. Field '${fieldName}' from type '${this.getTypeName()}' does not exist.`);
    }
  }

  hasFieldArg(fieldName, argName) {
    try {
      const fieldArgs = this.getFieldArgs(fieldName);
      return !!fieldArgs[argName];
    } catch (e) {
      return false;
    }
  }

  getFieldArg(fieldName, argName) {
    const fieldArgs = this.getFieldArgs(fieldName);

    if (!fieldArgs[argName]) {
      throw new Error(`Cannot get arg '${argName}' from type.field '${this.getTypeName()}.${fieldName}'. Argument does not exist.`);
    }

    return fieldArgs[argName];
  }

  getFieldArgType(fieldName, argName) {
    const ac = this.getFieldArg(fieldName, argName);
    return ac.type;
  } // -----------------------------------------------
  // Type methods
  // -----------------------------------------------


  getType() {
    return this.gqType;
  }

  getTypePlural() {
    return new _graphql.GraphQLList(this.gqType);
  }

  getTypeNonNull() {
    return new _graphql.GraphQLNonNull(this.gqType);
  }

  getTypeName() {
    return this.gqType.name;
  }

  setTypeName(name) {
    this.gqType.name = name;
    this.schemaComposer.add(this);
    return this;
  }

  getDescription() {
    return this.gqType.description || '';
  }

  setDescription(description) {
    this.gqType.description = description;
    return this;
  }

  clone(newTypeName) {
    if (!newTypeName) {
      throw new Error('You should provide newTypeName:string for TypeComposer.clone()');
    }

    const newFields = {};
    this.getFieldNames().forEach(fieldName => {
      const fc = this.getFieldConfig(fieldName);
      newFields[fieldName] = _objectSpread({}, fc);
    });
    const cloned = new this.schemaComposer.TypeComposer(new _graphql.GraphQLObjectType({
      name: newTypeName,
      fields: newFields
    }));
    cloned.setDescription(this.getDescription());

    try {
      cloned.setRecordIdFn(this.getRecordIdFn());
    } catch (e) {// no problem, clone without resolveIdFn
    }

    this.getResolvers().forEach(resolver => {
      const newResolver = resolver.clone();
      cloned.addResolver(newResolver);
    });
    return cloned;
  } // -----------------------------------------------
  // InputType methods
  // -----------------------------------------------


  getInputType() {
    return this.getInputTypeComposer().getType();
  }

  hasInputTypeComposer() {
    return !!this.gqType._gqcInputTypeComposer;
  }

  getInputTypeComposer() {
    if (!this.gqType._gqcInputTypeComposer) {
      this.gqType._gqcInputTypeComposer = (0, _toInputObjectType.toInputObjectType)(this);
    }

    return this.gqType._gqcInputTypeComposer;
  } // Alias for getInputTypeComposer()


  getITC() {
    return this.getInputTypeComposer();
  } // -----------------------------------------------
  // Resolver methods
  // -----------------------------------------------


  getResolvers() {
    if (!this.gqType._gqcResolvers) {
      this.gqType._gqcResolvers = new Map();
    }

    return this.gqType._gqcResolvers;
  }

  hasResolver(name) {
    if (!this.gqType._gqcResolvers) {
      return false;
    }

    return this.gqType._gqcResolvers.has(name);
  }

  getResolver(name) {
    if (!this.hasResolver(name)) {
      throw new Error(`Type ${this.getTypeName()} does not have resolver with name '${name}'`);
    }

    const resolverMap = this.gqType._gqcResolvers;
    return resolverMap.get(name);
  }

  setResolver(name, resolver) {
    if (!this.gqType._gqcResolvers) {
      this.gqType._gqcResolvers = new Map();
    }

    if (!(resolver instanceof _Resolver.Resolver)) {
      throw new Error('setResolver() accept only Resolver instance');
    }

    this.gqType._gqcResolvers.set(name, resolver);

    resolver.setDisplayName(`${this.getTypeName()}.${resolver.name}`);
    return this;
  }

  addResolver(opts) {
    if (!opts) {
      throw new Error('addResolver called with empty Resolver');
    }

    let resolver;

    if (!(opts instanceof _Resolver.Resolver)) {
      const resolverOpts = _objectSpread({}, opts); // add resolve method, otherwise added resolver will not return any data by graphql-js


      if (!resolverOpts.hasOwnProperty('resolve')) {
        resolverOpts.resolve = () => ({});
      }

      resolver = new this.schemaComposer.Resolver(resolverOpts);
    } else {
      resolver = opts;
    }

    if (!resolver.name) {
      throw new Error('resolver should have non-empty `name` property');
    }

    this.setResolver(resolver.name, resolver);
    return this;
  }

  removeResolver(resolverName) {
    if (resolverName) {
      this.getResolvers().delete(resolverName);
    }

    return this;
  }

  wrapResolver(resolverName, cbResolver) {
    const resolver = this.getResolver(resolverName);
    const newResolver = resolver.wrap(cbResolver);
    this.setResolver(resolverName, newResolver);
    return this;
  }

  wrapResolverAs(resolverName, fromResolverName, cbResolver) {
    const resolver = this.getResolver(fromResolverName);
    const newResolver = resolver.wrap(cbResolver);
    this.setResolver(resolverName, newResolver);
    return this;
  }

  wrapResolverResolve(resolverName, cbNextRp) {
    const resolver = this.getResolver(resolverName);
    this.setResolver(resolverName, resolver.wrapResolve(cbNextRp));
    return this;
  } // -----------------------------------------------
  // Interface methods
  // -----------------------------------------------


  getInterfaces() {
    if (!this.gqType._gqcInterfaces) {
      let interfaces;

      if (_graphqlVersion.graphqlVersion >= 14) {
        interfaces = this.gqType._interfaces;
      } else {
        // $FlowFixMe
        interfaces = this.gqType._typeConfig.interfaces;
      }

      this.gqType._gqcInterfaces = (0, _misc.resolveMaybeThunk)(interfaces) || [];
    }

    return this.gqType._gqcInterfaces;
  }

  setInterfaces(interfaces) {
    this.gqType._gqcInterfaces = interfaces;

    const interfacesThunk = () => {
      return interfaces.map(iface => {
        if (iface instanceof _graphql.GraphQLInterfaceType) {
          return iface;
        } else if (iface instanceof _InterfaceTypeComposer.InterfaceTypeComposer) {
          return iface.getType();
        }

        throw new Error(`For type ${this.getTypeName()} you provide incorrect interface object ${(0, _misc.inspect)(iface)}`);
      });
    };

    if (_graphqlVersion.graphqlVersion >= 14) {
      this.gqType._interfaces = interfacesThunk;
    } else {
      // $FlowFixMe
      this.gqType._typeConfig.interfaces = interfacesThunk;
      delete this.gqType._interfaces; // if schema was builded, delete _interfaces
    }

    return this;
  }

  hasInterface(interfaceObj) {
    return this.getInterfaces().indexOf(interfaceObj) > -1;
  }

  addInterface(interfaceObj) {
    if (!this.hasInterface(interfaceObj)) {
      this.setInterfaces([...this.getInterfaces(), interfaceObj]);
    }

    return this;
  }

  removeInterface(interfaceObj) {
    const interfaces = this.getInterfaces();
    const idx = interfaces.indexOf(interfaceObj);

    if (idx > -1) {
      interfaces.splice(idx, 1);
      this.setInterfaces(interfaces);
    }

    return this;
  } // -----------------------------------------------
  // Misc methods
  // -----------------------------------------------


  addRelation(fieldName, opts) {
    if (!this.gqType._gqcRelations) {
      this.gqType._gqcRelations = {};
    }

    this.gqType._gqcRelations[fieldName] = opts;

    if (opts.hasOwnProperty('resolver')) {
      this.setField(fieldName, () => {
        return this._relationWithResolverToFC(opts, fieldName);
      });
    } else if (opts.hasOwnProperty('type')) {
      const fc = opts;
      this.setField(fieldName, fc); // was: () => fc
    }

    return this;
  }

  getRelations() {
    if (!this.gqType._gqcRelations) {
      this.gqType._gqcRelations = {};
    }

    return this.gqType._gqcRelations;
  }

  _relationWithResolverToFC(opts, fieldName = '') {
    const resolver = (0, _is.isFunction)(opts.resolver) ? opts.resolver() : opts.resolver;

    if (!(resolver instanceof _Resolver.Resolver)) {
      throw new Error('You should provide correct Resolver object for relation ' + `${this.getTypeName()}.${fieldName}`);
    }

    if (opts.type) {
      throw new Error('You can not use `resolver` and `type` properties simultaneously for relation ' + `${this.getTypeName()}.${fieldName}`);
    }

    if (opts.resolve) {
      throw new Error('You can not use `resolver` and `resolve` properties simultaneously for relation ' + `${this.getTypeName()}.${fieldName}`);
    }

    const fieldConfig = resolver.getFieldConfig();

    const argsConfig = _objectSpread({}, fieldConfig.args);

    const argsProto = {};
    const argsRuntime = []; // remove args from config, if arg name provided in args
    //    if `argMapVal`
    //       is `undefined`, then keep arg field in config
    //       is `null`, then just remove arg field from config
    //       is `function`, then remove arg field and run it in resolve
    //       is any other value, then put it to args prototype for resolve

    const optsArgs = opts.prepareArgs || {};
    Object.keys(optsArgs).forEach(argName => {
      const argMapVal = optsArgs[argName];

      if (argMapVal !== undefined) {
        delete argsConfig[argName];

        if ((0, _is.isFunction)(argMapVal)) {
          argsRuntime.push([argName, argMapVal]);
        } else if (argMapVal !== null) {
          argsProto[argName] = argMapVal;
        }
      }
    }); // if opts.catchErrors is undefined then set true, otherwise take it value

    const _opts$catchErrors = opts.catchErrors,
          catchErrors = _opts$catchErrors === void 0 ? true : _opts$catchErrors;

    const resolve = (source, args, context, info) => {
      const newArgs = _objectSpread({}, args, argsProto);

      argsRuntime.forEach(([argName, argFn]) => {
        newArgs[argName] = argFn(source, args, context, info);
      });
      const payload = fieldConfig.resolve ? fieldConfig.resolve(source, newArgs, context, info) : null;
      return catchErrors ? Promise.resolve(payload).catch(e => {
        // eslint-disable-next-line
        console.log(`GQC ERROR: relation for ${this.getTypeName()}.${fieldName} throws error:`);
        console.log(e); // eslint-disable-line

        return null;
      }) : payload;
    };

    return {
      type: fieldConfig.type,
      description: opts.description,
      deprecationReason: opts.deprecationReason,
      args: argsConfig,
      resolve,
      projection: opts.projection
    };
  }

  setRecordIdFn(fn) {
    this.gqType._gqcGetRecordIdFn = fn;
    return this;
  }

  hasRecordIdFn() {
    return !!this.gqType._gqcGetRecordIdFn;
  }

  getRecordIdFn() {
    if (!this.gqType._gqcGetRecordIdFn) {
      throw new Error(`Type ${this.getTypeName()} does not have RecordIdFn`);
    }

    return this.gqType._gqcGetRecordIdFn;
  }
  /**
   * Get function that returns record id, from provided object.
   */


  getRecordId(source, args, context) {
    return this.getRecordIdFn()(source, args, context);
  }

  get(path) {
    return (0, _typeByPath.typeByPath)(this, path);
  }

}

exports.TypeComposer = TypeComposer;
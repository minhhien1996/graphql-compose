function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*  strict */

/* eslint-disable no-use-before-define */
import keyMap from 'graphql/jsutils/keyMap';
import { GraphQLEnumType, GraphQLList, GraphQLNonNull } from './graphql';
import { isObject, isString } from './utils/is';
import { defineEnumValues, defineEnumValuesToConfig } from './utils/configToDefine';
import { graphqlVersion } from './utils/graphqlVersion';
export class EnumTypeComposer {
  get schemaComposer() {
    return this.constructor.schemaComposer;
  }

  static create(opts) {
    const etc = this.createTemp(opts);
    this.schemaComposer.add(etc);
    return etc;
  }

  static createTemp(opts) {
    if (!this.schemaComposer) {
      throw new Error('Class<EnumTypeComposer> must be created by a SchemaComposer.');
    }

    let ETC;

    if (isString(opts)) {
      const typeName = opts;
      const NAME_RX = /^[_a-zA-Z][_a-zA-Z0-9]*$/;

      if (NAME_RX.test(typeName)) {
        ETC = new this.schemaComposer.EnumTypeComposer(new GraphQLEnumType({
          name: typeName,
          values: graphqlVersion < 13 ? {
            _OldGraphqlStubValue_: {}
          } : {}
        }));
      } else {
        const type = this.schemaComposer.typeMapper.createType(typeName);

        if (!(type instanceof GraphQLEnumType)) {
          throw new Error('You should provide correct GraphQLEnumType type definition.' + 'Eg. `enum MyType { KEY1 KEY2 KEY3 }`');
        }

        ETC = new this.schemaComposer.EnumTypeComposer(type);
      }
    } else if (opts instanceof GraphQLEnumType) {
      ETC = new this.schemaComposer.EnumTypeComposer(opts);
    } else if (isObject(opts)) {
      const type = new GraphQLEnumType(_objectSpread({}, opts));
      ETC = new this.schemaComposer.EnumTypeComposer(type);
    } else {
      throw new Error('You should provide GraphQLEnumTypeConfig or string with enum name or SDL');
    }

    return ETC;
  }

  constructor(gqType) {
    if (!this.schemaComposer) {
      throw new Error('Class<EnumTypeComposer> can only be created by a SchemaComposer.');
    }

    if (!(gqType instanceof GraphQLEnumType)) {
      throw new Error('EnumTypeComposer accept only GraphQLEnumType in constructor');
    }

    this.gqType = gqType;
  } // -----------------------------------------------
  // Value methods
  // -----------------------------------------------


  hasField(name) {
    const values = this.getFields();
    return !!values[name];
  }

  _fixEnumBelowV13() {
    if (graphqlVersion < 13) {
      if (!this.gqType._values) {
        // $FlowFixMe Support for graphql@0.11 and below
        this.gqType._values = defineEnumValues(this.gqType, this.gqType._enumConfig.values);
      }

      this.gqType._values = this.gqType._values.filter(o => o.name !== '_OldGraphqlStubValue_');
    }
  }

  getFields() {
    if (graphqlVersion >= 14) {
      return defineEnumValuesToConfig(this.gqType._values);
    } else {
      this._fixEnumBelowV13();

      return this.gqType._getNameLookup();
    }
  }

  getField(name) {
    const values = this.getFields();

    if (!values[name]) {
      throw new Error(`Cannot get value '${name}' from enum type '${this.getTypeName()}'. Value with such name does not exist.`);
    }

    return values[name];
  }

  getFieldNames() {
    return Object.keys(this.getFields());
  }
  /**
   * Completely replace all values in GraphQL enum type
   * WARNING: this method rewrite an internal GraphQL instance properties.
   */


  setFields(values) {
    if (graphqlVersion >= 14) {
      this.gqType._values = defineEnumValues(this.gqType, values);
      this.gqType._valueLookup = new Map(this.gqType._values.map(enumValue => [enumValue.value, enumValue]));
      this.gqType._nameLookup = keyMap(this.gqType._values, value => value.name);
    } else {
      // cleanup isDepricated
      Object.keys(values).forEach(key => {
        // $FlowFixMe
        delete values[key].isDeprecated; // eslint-disable-line
      }); // $FlowFixMe

      this.gqType._enumConfig.values = values; // clear builded fields in type

      delete this.gqType._values;
      delete this.gqType._valueLookup;
      delete this.gqType._nameLookup;

      this._fixEnumBelowV13();
    }

    return this;
  }

  setField(name, valueConfig) {
    this.addFields({
      [name]: valueConfig
    });
    return this;
  }
  /**
   * Add new fields or replace existed in a GraphQL type
   */


  addFields(newValues) {
    this.setFields(_objectSpread({}, this.getFields(), newValues));
    return this;
  }

  removeField(nameOrArray) {
    const valueNames = Array.isArray(nameOrArray) ? nameOrArray : [nameOrArray];
    const values = this.getFields();
    valueNames.forEach(valueName => delete values[valueName]);
    this.setFields(_objectSpread({}, values));
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

  extendField(name, partialValueConfig) {
    let prevValueConfig;

    try {
      prevValueConfig = this.getField(name);
    } catch (e) {
      throw new Error(`Cannot extend value '${name}' from enum '${this.getTypeName()}'. Value does not exist.`);
    }

    const valueConfig = _objectSpread({}, prevValueConfig, partialValueConfig);

    this.setField(name, valueConfig);
    return this;
  }

  deprecateFields(fields) {
    const existedFieldNames = this.getFieldNames();

    if (typeof fields === 'string') {
      if (existedFieldNames.indexOf(fields) === -1) {
        throw new Error(`Cannot deprecate unexisted value '${fields}' from enum '${this.getTypeName()}'`);
      }

      this.extendField(fields, {
        deprecationReason: 'deprecated'
      });
    } else if (Array.isArray(fields)) {
      fields.forEach(field => {
        if (existedFieldNames.indexOf(field) === -1) {
          throw new Error(`Cannot deprecate unexisted value '${field}' from enum '${this.getTypeName()}'`);
        }

        this.extendField(field, {
          deprecationReason: 'deprecated'
        });
      });
    } else {
      const fieldMap = fields;
      Object.keys(fieldMap).forEach(field => {
        if (existedFieldNames.indexOf(field) === -1) {
          throw new Error(`Cannot deprecate unexisted value '${field}' from enum '${this.getTypeName()}'`);
        }

        const deprecationReason = fieldMap[field];
        this.extendField(field, {
          deprecationReason
        });
      });
    }

    return this;
  } // -----------------------------------------------
  // Type methods
  // -----------------------------------------------


  getType() {
    return this.gqType;
  }

  getTypePlural() {
    return new GraphQLList(this.gqType);
  }

  getTypeNonNull() {
    return new GraphQLNonNull(this.gqType);
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
      throw new Error('You should provide newTypeName:string for EnumTypeComposer.clone()');
    }

    const values = this.getFields();
    const newValues = {};
    Object.keys(values).forEach(fieldName => {
      newValues[fieldName] = _objectSpread({}, values[fieldName]);
      delete newValues[fieldName].isDeprecated;
    });
    const cloned = new this.schemaComposer.EnumTypeComposer(new GraphQLEnumType({
      name: newTypeName,
      values: newValues
    }));
    cloned.setDescription(this.getDescription());
    return cloned;
  }

}
"use strict";

var _graphql = require("../graphql");

var _ = require("..");

var _graphqlVersion = require("../utils/graphqlVersion");

/*  strict */
beforeEach(() => {
  _.schemaComposer.clear();
});
describe('InputTypeComposer', () => {
  let objectType;
  let itc;
  beforeEach(() => {
    objectType = new _graphql.GraphQLInputObjectType({
      name: 'InputType',
      description: 'Mock type',
      fields: {
        input1: {
          type: _graphql.GraphQLString
        },
        input2: {
          type: _graphql.GraphQLString
        }
      }
    });
    itc = new _.InputTypeComposer(objectType);
  });
  describe('field manipulation methods', () => {
    it('getFields()', () => {
      const fieldNames = Object.keys(itc.getFields());
      expect(fieldNames).toEqual(expect.arrayContaining(['input1', 'input2']));
    });
    it('getFieldNames()', () => {
      expect(itc.getFieldNames()).toEqual(expect.arrayContaining(['input1', 'input2']));
    });
    describe('getField()', () => {
      it('should return field config', () => {
        expect(itc.getFieldType('input1')).toBe(_graphql.GraphQLString);
      });
      it('should throw error if field does not exist', () => {
        expect(() => itc.getField('unexisted')).toThrowError(/Cannot get field.*does not exist/);
      });
    });
    it('hasField()', () => {
      expect(itc.hasField('input1')).toBe(true);
      expect(itc.hasField('missing')).toBe(false);
    });
    it('setField()', () => {
      itc.setField('input3', {
        type: _graphql.GraphQLString
      });
      const fieldNames = Object.keys(objectType.getFields());
      expect(fieldNames).toContain('input3');
    });
    describe('setFields()', () => {
      it('accept regular fields definition', () => {
        itc.setFields({
          input3: {
            type: _graphql.GraphQLString
          },
          input4: {
            type: _graphql.GraphQLString
          }
        });
        expect(itc.getFieldNames()).not.toEqual(expect.arrayContaining(['input1', 'input2']));
        expect(itc.getFieldNames()).toEqual(expect.arrayContaining(['input3', 'input4']));
        expect(itc.getFieldType('input3')).toBe(_graphql.GraphQLString);
        expect(itc.getFieldType('input4')).toBe(_graphql.GraphQLString);
      });
      it('accept shortand fields definition', () => {
        itc.setFields({
          input3: _graphql.GraphQLString,
          input4: 'String'
        });
        expect(itc.getFieldType('input3')).toBe(_graphql.GraphQLString);
        expect(itc.getFieldType('input4')).toBe(_graphql.GraphQLString);
      });
      it('accept types as function', () => {
        const typeAsFn = () => _graphql.GraphQLString;

        itc.setFields({
          input3: {
            type: typeAsFn
          }
        });
        expect(itc.getField('input3').type).toBe(typeAsFn);
        expect(itc.getFieldType('input3')).toBe(_graphql.GraphQLString); // show provide unwrapped/unhoisted type for graphql

        if (_graphqlVersion.graphqlVersion >= 14) {
          expect(itc.getType()._fields().input3.type).toBe(_graphql.GraphQLString);
        } else {
          expect(itc.getType()._typeConfig.fields().input3.type).toBe(_graphql.GraphQLString);
        }
      });
    });
    it('addFields()', () => {
      itc.addFields({
        input3: {
          type: _graphql.GraphQLString
        },
        input4: {
          type: _graphql.GraphQLString
        }
      });
      expect(itc.getFieldNames()).toEqual(expect.arrayContaining(['input1', 'input2', 'input3', 'input4']));
    });
    it('addNestedFields()', () => {
      itc.addNestedFields({
        'fieldNested1.f1': {
          type: _graphql.GraphQLString
        },
        fieldNested2: {
          type: '[Int]'
        },
        'fieldNested1.f2': 'Boolean!'
      });
      expect(itc.getFieldType('fieldNested1')).toBeInstanceOf(_graphql.GraphQLInputObjectType);
      const fieldTC = itc.getFieldTC('fieldNested1');
      expect(fieldTC.getTypeName()).toBe('InputTypeFieldNested1');
      expect(fieldTC.getFieldType('f1')).toBe(_graphql.GraphQLString);
      expect(fieldTC.getFieldType('f2')).toBeInstanceOf(_graphql.GraphQLNonNull);
      expect(fieldTC.getFieldType('f2').ofType).toBe(_graphql.GraphQLBoolean);
      expect(itc.getFieldType('fieldNested2')).toBeInstanceOf(_graphql.GraphQLList);
      expect(itc.getFieldType('fieldNested2').ofType).toBe(_graphql.GraphQLInt);
    });
    it('removeField()', () => {
      itc.removeField('input1');
      expect(itc.getFieldNames()).not.toContain('input1');
      expect(itc.getFieldNames()).toContain('input2');
      itc.removeField(['input2', 'input3']);
      expect(itc.getFieldNames()).not.toContain('input2');
    });
    it('removeOtherFields()', () => {
      const cfg = {
        name: 'MyInput',
        fields: {
          input1: 'String',
          input2: 'String',
          input3: 'String'
        }
      };

      const itc1 = _.InputTypeComposer.create(cfg);

      itc1.removeOtherFields('input1');
      expect(itc1.getFieldNames()).toEqual(expect.arrayContaining(['input1']));
      expect(itc1.getFieldNames()).not.toEqual(expect.arrayContaining(['input2', 'input3']));

      const itc2 = _.InputTypeComposer.create(cfg);

      itc2.removeOtherFields(['input1', 'input2']);
      expect(itc2.getFieldNames()).toEqual(expect.arrayContaining(['input1', 'input2']));
      expect(itc2.getFieldNames()).not.toEqual(expect.arrayContaining(['input3']));
    });
    describe('reorderFields()', () => {
      it('should change fields order', () => {
        const itcOrder = _.InputTypeComposer.create({
          name: 'Type',
          fields: {
            f1: 'Int',
            f2: 'Int',
            f3: 'Int '
          }
        });

        expect(itcOrder.getFieldNames().join(',')).toBe('f1,f2,f3');
        itcOrder.reorderFields(['f3', 'f2', 'f1']);
        expect(itcOrder.getFieldNames().join(',')).toBe('f3,f2,f1');
      });
      it('should append not listed fields', () => {
        const itcOrder = _.InputTypeComposer.create({
          name: 'Type',
          fields: {
            f1: 'Int',
            f2: 'Int',
            f3: 'Int '
          }
        });

        expect(itcOrder.getFieldNames().join(',')).toBe('f1,f2,f3');
        itcOrder.reorderFields(['f3']);
        expect(itcOrder.getFieldNames().join(',')).toBe('f3,f1,f2');
      });
      it('should skip non existed fields', () => {
        const itcOrder = _.InputTypeComposer.create({
          name: 'Type',
          fields: {
            f1: 'Int',
            f2: 'Int',
            f3: 'Int '
          }
        });

        expect(itcOrder.getFieldNames().join(',')).toBe('f1,f2,f3');
        itcOrder.reorderFields(['f22', 'f3', 'f55', 'f1', 'f2']);
        expect(itcOrder.getFieldNames().join(',')).toBe('f3,f1,f2');
      });
    });
    describe('should extend field by name', () => {
      it('should extend existed fields', () => {
        itc.setField('input3', {
          type: _graphql.GraphQLString
        });
        itc.extendField('input3', {
          description: 'this is input #3'
        });
        expect(itc.getFieldConfig('input3').type).toBe(_graphql.GraphQLString);
        expect(itc.getFieldConfig('input3').description).toBe('this is input #3');
        itc.extendField('input3', {
          type: 'Int'
        });
        expect(itc.getFieldConfig('input3').type).toBe(_graphql.GraphQLInt);
      });
      it('should work with fieldConfig as string', () => {
        itc.setField('field4', 'String');
        itc.extendField('field4', {
          description: 'this is field #4'
        });
        expect(itc.getFieldConfig('field4').type).toBe(_graphql.GraphQLString);
        expect(itc.getFieldConfig('field4').description).toBe('this is field #4');
      });
      it('should throw error if field does not exists', () => {
        expect(() => itc.extendField('unexisted', {
          description: '123'
        })).toThrow(/Cannot extend field.*Field does not exist/);
      });
    });
    it('getFieldType()', () => {
      expect(itc.getFieldType('input1')).toBe(_graphql.GraphQLString);
    });
    it('isRequired()', () => {
      itc.setField('input1', 'String');
      expect(itc.isRequired('input1')).toBe(false);
      itc.setField('input1', 'String!');
      expect(itc.isRequired('input1')).toBe(true);
    });
    it('isFieldNonNull()', () => {
      itc.setField('input1', 'String');
      expect(itc.isFieldNonNull('input1')).toBe(false);
      itc.setField('input1', 'String!');
      expect(itc.isFieldNonNull('input1')).toBe(true);
    });
    it('makeFieldNonNull()', () => {
      itc.makeFieldNonNull('input1');
      expect(itc.getFieldType('input1')).toBeInstanceOf(_graphql.GraphQLNonNull);
      expect(itc.getFieldType('input1').ofType).toBe(_graphql.GraphQLString);
      expect(itc.isFieldNonNull('input1')).toBe(true);
      expect(itc.isRequired('input1')).toBe(true);
    });
    it('makeRequired()', () => {
      itc.setField('input1', 'String');
      itc.makeRequired('input1');
      expect(itc.isFieldNonNull('input1')).toBe(true);
    });
    it('makeFieldNullable()', () => {
      itc.makeFieldNonNull('input1');
      expect(itc.isFieldNonNull('input1')).toBe(true);
      itc.makeFieldNullable('input1');
      expect(itc.isFieldNonNull('input1')).toBe(false);
    });
    it('makeOptional()', () => {
      itc.makeRequired('input1');
      expect(itc.isRequired('input1')).toBe(true);
      itc.makeOptional('input1');
      expect(itc.isRequired('input1')).toBe(false);
    });
    it('should add fields with converting types from string to object', () => {
      itc.setField('input3', {
        type: 'String'
      });
      itc.addFields({
        input4: {
          type: '[Int]'
        },
        input5: {
          type: 'Boolean!'
        }
      });
      expect(itc.getFieldType('input3')).toBe(_graphql.GraphQLString);
      expect(itc.getFieldType('input4')).toBeInstanceOf(_graphql.GraphQLList);
      expect(itc.getFieldType('input4').ofType).toBe(_graphql.GraphQLInt);
      expect(itc.getFieldType('input5')).toBeInstanceOf(_graphql.GraphQLNonNull);
      expect(itc.getFieldType('input5').ofType).toBe(_graphql.GraphQLBoolean);
    });
  });
  describe('type manipulation methods', () => {
    it('getType()', () => {
      expect(itc.getType()).toBeInstanceOf(_graphql.GraphQLInputObjectType);
      expect(itc.getType().name).toBe('InputType');
    });
    it('getTypeNonNull()', () => {
      expect(itc.getTypeNonNull()).toBeInstanceOf(_graphql.GraphQLNonNull);
      expect(itc.getTypeNonNull().ofType.name).toBe('InputType');
    });
    it('getTypePlural()', () => {
      expect(itc.getTypePlural()).toBeInstanceOf(_graphql.GraphQLList);
      expect(itc.getTypePlural().ofType.name).toBe('InputType');
    });
    it('getTypeName()', () => {
      expect(itc.getTypeName()).toBe('InputType');
    });
    it('setTypeName()', () => {
      itc.setTypeName('OtherInputType');
      expect(itc.getTypeName()).toBe('OtherInputType');
    });
    it('getDescription()', () => {
      expect(itc.getDescription()).toBe('Mock type');
    });
    it('setDescription()', () => {
      itc.setDescription('Changed description');
      expect(itc.getDescription()).toBe('Changed description');
    });
  });
  describe('static method create()', () => {
    it('should create ITC by typeName as a string', () => {
      const itc1 = _.InputTypeComposer.create('TypeStub');

      expect(itc1).toBeInstanceOf(_.InputTypeComposer);
      expect(itc1.getType()).toBeInstanceOf(_graphql.GraphQLInputObjectType);
      expect(itc1.getFields()).toEqual({});
    });
    it('should create ITC by type template string', () => {
      const itc1 = _.InputTypeComposer.create(`
        input TestTypeTplInput {
          f1: String @default(value: "new")
          # Description for some required Int field
          f2: Int!
        }
      `);

      expect(itc1).toBeInstanceOf(_.InputTypeComposer);
      expect(itc1.getTypeName()).toBe('TestTypeTplInput');
      expect(itc1.getFieldType('f1')).toBe(_graphql.GraphQLString);
      expect(itc1.getField('f1').defaultValue).toBe('new');
      expect(itc1.getFieldType('f2')).toBeInstanceOf(_graphql.GraphQLNonNull);
      expect(itc1.getFieldType('f2').ofType).toBe(_graphql.GraphQLInt);
    });
    it('should create ITC by GraphQLObjectTypeConfig', () => {
      const itc1 = _.InputTypeComposer.create({
        name: 'TestTypeInput',
        fields: {
          f1: {
            type: 'String'
          },
          f2: 'Int!'
        }
      });

      expect(itc1).toBeInstanceOf(_.InputTypeComposer);
      expect(itc1.getFieldType('f1')).toBe(_graphql.GraphQLString);
      expect(itc1.getFieldType('f2')).toBeInstanceOf(_graphql.GraphQLNonNull);
      expect(itc1.getFieldType('f2').ofType).toBe(_graphql.GraphQLInt);
    });
    it('should create ITC by GraphQLObjectTypeConfig with fields as Thunk', () => {
      const itc1 = _.InputTypeComposer.create({
        name: 'TestTypeInput',
        fields: () => ({
          f1: {
            type: 'String'
          },
          f2: 'Int!'
        })
      });

      expect(itc1).toBeInstanceOf(_.InputTypeComposer);
      expect(itc1.getFieldType('f1')).toBe(_graphql.GraphQLString);
      expect(itc1.getFieldType('f2')).toBeInstanceOf(_graphql.GraphQLNonNull);
      expect(itc1.getFieldType('f2').ofType).toBe(_graphql.GraphQLInt);
    });
    it('should create ITC by GraphQLInputObjectType', () => {
      const objType = new _graphql.GraphQLInputObjectType({
        name: 'TestTypeObj',
        fields: {
          f1: {
            type: _graphql.GraphQLString
          }
        }
      });

      const itc1 = _.InputTypeComposer.create(objType);

      expect(itc1).toBeInstanceOf(_.InputTypeComposer);
      expect(itc1.getType()).toBe(objType);
      expect(itc1.getFieldType('f1')).toBe(_graphql.GraphQLString);
    });
    it('should create type and store it in schemaComposer', () => {
      const SomeUserITC = _.InputTypeComposer.create('SomeUserInput');

      expect(_.schemaComposer.getITC('SomeUserInput')).toBe(SomeUserITC);
    });
    it('createTemp() should not store type in schemaComposer', () => {
      _.InputTypeComposer.createTemp('SomeUserInput');

      expect(_.schemaComposer.has('SomeUserInput')).toBeFalsy();
    });
  });
  it('get() should return type by path', () => {
    const itc1 = new _.InputTypeComposer(new _graphql.GraphQLInputObjectType({
      name: 'Writable',
      fields: {
        field1: {
          type: _graphql.GraphQLString
        }
      }
    }));
    expect(itc1.get('field1')).toBe(_graphql.GraphQLString);
  });
  it('should have chainable methods', () => {
    const itc1 = _.InputTypeComposer.create('InputType');

    expect(itc1.setFields({})).toBe(itc1);
    expect(itc1.setField('f1', 'String')).toBe(itc1);
    expect(itc1.extendField('f1', {})).toBe(itc1);
    expect(itc1.addFields({})).toBe(itc1);
    expect(itc1.removeField('f1')).toBe(itc1);
    expect(itc1.removeOtherFields('f1')).toBe(itc1);
    expect(itc1.reorderFields(['f1'])).toBe(itc1);
    expect(itc1.makeRequired('f1')).toBe(itc1);
    expect(itc1.makeOptional('f1')).toBe(itc1);
    expect(itc1.setTypeName('InputType2')).toBe(itc1);
    expect(itc1.setDescription('Test')).toBe(itc1);
  });
  describe('getFieldTC()', () => {
    const myITC = _.InputTypeComposer.create('MyCustomInputType');

    myITC.addFields({
      scalar: 'String',
      list: '[Int]',
      obj: _.InputTypeComposer.create(`input ICustomObjInputType { name: String }`),
      objArr: [_.InputTypeComposer.create(`input ICustomObjInputType2 { name: String }`)]
    });
    it('should return InputTypeComposer for object field', () => {
      const objTC = myITC.getFieldTC('obj');
      expect(objTC.getTypeName()).toBe('ICustomObjInputType');
    });
    it('should return InputTypeComposer for wrapped object field', () => {
      const objTC = myITC.getFieldTC('objArr');
      expect(objTC.getTypeName()).toBe('ICustomObjInputType2');
    });
    it('should throw error for non-object fields', () => {
      expect(() => {
        myITC.getFieldTC('scalar');
      }).toThrow('field should be InputObjectType');
      expect(() => {
        myITC.getFieldTC('list');
      }).toThrow('field should be InputObjectType');
    });
  });
});
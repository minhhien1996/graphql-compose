"use strict";

var _graphql = require("../../graphql");

var _ = require("../..");

var _configAsThunk = require("../configAsThunk");

/*  strict */
describe('configAsThunk', () => {
  describe('resolveOutputConfigMapAsThunk()', () => {
    it('should unwrap fields from functions', () => {
      const fieldMap = {
        f0: () => ({
          type: _graphql.GraphQLString,
          description: 'Field0'
        }),
        f1: () => ({
          type: 'String',
          description: 'Field1'
        }),
        f3: {
          type: new _graphql.GraphQLObjectType({
            name: 'MyType',
            fields: {
              f11: {
                type: _graphql.GraphQLString
              }
            }
          }),
          description: 'Field3'
        },
        f5: () => ({
          type: _.TypeComposer.create('type LonLat { lon: Float, lat: Float}'),
          description: 'Field5'
        })
      };
      const unwrapped = (0, _configAsThunk.resolveOutputConfigMapAsThunk)(_.schemaComposer, fieldMap);
      expect(unwrapped.f0.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f0.description).toBe('Field0');
      expect(unwrapped.f1.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f1.description).toBe('Field1');
      expect(unwrapped.f3.type).toBeInstanceOf(_graphql.GraphQLObjectType);
      expect(unwrapped.f3.type.name).toBe('MyType');
      expect(unwrapped.f3.description).toBe('Field3');
      expect(unwrapped.f5.type).toBeInstanceOf(_graphql.GraphQLObjectType);
      expect(unwrapped.f5.type.name).toBe('LonLat');
      expect(unwrapped.f5.description).toBe('Field5');
    });
    it('should unwrap types from functions', () => {
      const fieldMap = {
        f1: {
          type: _graphql.GraphQLString
        },
        f2: {
          type: () => _graphql.GraphQLString,
          description: 'Field2'
        },
        f3: {
          type: new _graphql.GraphQLObjectType({
            name: 'MyType',
            fields: {
              f11: {
                type: _graphql.GraphQLString
              }
            }
          }),
          description: 'Field3'
        },
        f4: {
          type: () => 'String'
        },
        f5: {
          type: () => _.TypeComposer.create('type LonLat { lon: Float, lat: Float}'),
          description: 'Field5'
        }
      };
      const unwrapped = (0, _configAsThunk.resolveOutputConfigMapAsThunk)(_.schemaComposer, fieldMap);
      expect(unwrapped.f1.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f2.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f3.type).toBeInstanceOf(_graphql.GraphQLObjectType);
      expect(unwrapped.f3.type.name).toBe('MyType');
      expect(unwrapped.f3.description).toBe('Field3');
      expect(unwrapped.f4.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f5.type).toBeInstanceOf(_graphql.GraphQLObjectType);
      expect(unwrapped.f5.type.name).toBe('LonLat');
      expect(unwrapped.f5.description).toBe('Field5');
    });
    it('should unwrap fields from functions and type from function', () => {
      const fieldMap = {
        f3: () => ({
          type: () => _graphql.GraphQLString,
          description: 'Field3'
        }),
        f4: () => ({
          type: () => 'String',
          description: 'Field4'
        })
      };
      const unwrapped = (0, _configAsThunk.resolveOutputConfigMapAsThunk)(_.schemaComposer, fieldMap);
      expect(unwrapped.f3.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f4.type).toBe(_graphql.GraphQLString);
    });
    it('should works with arg as function', () => {
      const fieldMap = {
        f6: {
          type: _graphql.GraphQLString,
          args: {
            a1: () => _graphql.GraphQLString,
            a2: () => ({
              type: _graphql.GraphQLString,
              description: 'Desc'
            }),
            a3: {
              type: () => _graphql.GraphQLString
            }
          }
        }
      };
      const unwrapped = (0, _configAsThunk.resolveOutputConfigMapAsThunk)(_.schemaComposer, fieldMap);
      const args = unwrapped.f6.args;
      expect(args.a1.type).toBe(_graphql.GraphQLString);
      expect(args.a2.type).toBe(_graphql.GraphQLString);
      expect(args.a2.description).toBe('Desc');
      expect(args.a3.type).toBe(_graphql.GraphQLString);
    });
  });
  describe('resolveInputConfigMapAsThunk()', () => {
    it('should unwrap fields from functions', () => {
      const fieldMap = {
        f0: () => ({
          type: _graphql.GraphQLString,
          description: 'Field0'
        }),
        f1: () => ({
          type: 'String',
          description: 'Field1'
        }),
        f3: {
          type: new _graphql.GraphQLInputObjectType({
            name: 'MyType',
            fields: {
              f11: {
                type: _graphql.GraphQLString
              }
            }
          }),
          description: 'Field3'
        },
        f5: () => ({
          type: _.InputTypeComposer.create('input LonLat { lon: Float, lat: Float}'),
          description: 'Field5'
        })
      };
      const unwrapped = (0, _configAsThunk.resolveInputConfigMapAsThunk)(_.schemaComposer, fieldMap);
      expect(unwrapped.f0.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f0.description).toBe('Field0');
      expect(unwrapped.f1.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f1.description).toBe('Field1');
      expect(unwrapped.f3.type).toBeInstanceOf(_graphql.GraphQLInputObjectType);
      expect(unwrapped.f3.type.name).toBe('MyType');
      expect(unwrapped.f3.description).toBe('Field3');
      expect(unwrapped.f5.type).toBeInstanceOf(_graphql.GraphQLInputObjectType);
      expect(unwrapped.f5.type.name).toBe('LonLat');
      expect(unwrapped.f5.description).toBe('Field5');
    });
    it('should unwrap types from functions', () => {
      const fieldMap = {
        f1: {
          type: _graphql.GraphQLString
        },
        f2: {
          type: () => _graphql.GraphQLString,
          description: 'Field2'
        },
        f3: {
          type: new _graphql.GraphQLInputObjectType({
            name: 'MyType',
            fields: {
              f11: {
                type: _graphql.GraphQLString
              }
            }
          }),
          description: 'Field3'
        },
        f4: {
          type: () => 'String'
        },
        f5: {
          type: () => _.InputTypeComposer.create('input LonLat { lon: Float, lat: Float}'),
          description: 'Field5'
        }
      };
      const unwrapped = (0, _configAsThunk.resolveInputConfigMapAsThunk)(_.schemaComposer, fieldMap);
      expect(unwrapped.f1.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f2.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f3.type).toBeInstanceOf(_graphql.GraphQLInputObjectType);
      expect(unwrapped.f3.type.name).toBe('MyType');
      expect(unwrapped.f3.description).toBe('Field3');
      expect(unwrapped.f4.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f5.type).toBeInstanceOf(_graphql.GraphQLInputObjectType);
      expect(unwrapped.f5.type.name).toBe('LonLat');
      expect(unwrapped.f5.description).toBe('Field5');
    });
    it('should unwrap fields from functions and type from function', () => {
      const fieldMap = {
        f3: () => ({
          type: () => _graphql.GraphQLString,
          description: 'Field3'
        }),
        f4: () => ({
          type: () => 'String',
          description: 'Field4'
        })
      };
      const unwrapped = (0, _configAsThunk.resolveInputConfigMapAsThunk)(_.schemaComposer, fieldMap);
      expect(unwrapped.f3.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f3.description).toBe('Field3');
      expect(unwrapped.f4.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f4.description).toBe('Field4');
    });
  });
  describe('resolveArgConfigMapAsThunk()', () => {
    it('should unwrap fields from functions', () => {
      const argMap = {
        f0: () => ({
          type: _graphql.GraphQLString,
          description: 'Field0'
        }),
        f1: () => ({
          type: 'String',
          description: 'Field1'
        }),
        f3: {
          type: new _graphql.GraphQLInputObjectType({
            name: 'MyType',
            fields: {
              f11: {
                type: _graphql.GraphQLString
              }
            }
          }),
          description: 'Field3'
        },
        f5: () => ({
          type: _.InputTypeComposer.create('input LonLat { lon: Float, lat: Float}'),
          description: 'Field5'
        })
      };
      const unwrapped = (0, _configAsThunk.resolveArgConfigMapAsThunk)(_.schemaComposer, argMap);
      expect(unwrapped.f0.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f0.description).toBe('Field0');
      expect(unwrapped.f1.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f1.description).toBe('Field1');
      expect(unwrapped.f3.type).toBeInstanceOf(_graphql.GraphQLInputObjectType);
      expect(unwrapped.f3.type.name).toBe('MyType');
      expect(unwrapped.f3.description).toBe('Field3');
      expect(unwrapped.f5.type).toBeInstanceOf(_graphql.GraphQLInputObjectType);
      expect(unwrapped.f5.type.name).toBe('LonLat');
      expect(unwrapped.f5.description).toBe('Field5');
    });
    it('should unwrap types from functions', () => {
      const argMap = {
        f1: {
          type: _graphql.GraphQLString
        },
        f2: {
          type: () => _graphql.GraphQLString,
          description: 'Field2'
        },
        f3: {
          type: new _graphql.GraphQLInputObjectType({
            name: 'MyType',
            fields: {
              f11: {
                type: _graphql.GraphQLString
              }
            }
          }),
          description: 'Field3'
        },
        f4: {
          type: () => 'String'
        },
        f5: {
          type: () => _.InputTypeComposer.create('input LonLat { lon: Float, lat: Float}'),
          description: 'Field5'
        }
      };
      const unwrapped = (0, _configAsThunk.resolveArgConfigMapAsThunk)(_.schemaComposer, argMap);
      expect(unwrapped.f1.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f2.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f3.type).toBeInstanceOf(_graphql.GraphQLInputObjectType);
      expect(unwrapped.f3.type.name).toBe('MyType');
      expect(unwrapped.f3.description).toBe('Field3');
      expect(unwrapped.f4.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f5.type).toBeInstanceOf(_graphql.GraphQLInputObjectType);
      expect(unwrapped.f5.type.name).toBe('LonLat');
      expect(unwrapped.f5.description).toBe('Field5');
    });
    it('should unwrap fields from functions and type from function', () => {
      const argMap = {
        f3: () => ({
          type: () => _graphql.GraphQLString,
          description: 'Field3'
        }),
        f4: () => ({
          type: () => 'String',
          description: 'Field4'
        })
      };
      const unwrapped = (0, _configAsThunk.resolveArgConfigMapAsThunk)(_.schemaComposer, argMap);
      expect(unwrapped.f3.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f3.description).toBe('Field3');
      expect(unwrapped.f4.type).toBe(_graphql.GraphQLString);
      expect(unwrapped.f4.description).toBe('Field4');
    });
  });
});
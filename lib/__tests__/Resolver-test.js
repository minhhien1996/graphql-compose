"use strict";

var _graphql = require("../graphql");

var _schemaComposer = _interopRequireDefault(require("../__mocks__/schemaComposer"));

var _ = require("..");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

describe('Resolver', () => {
  let resolver;
  beforeEach(() => {
    resolver = new _.Resolver({
      name: 'find'
    });
  });
  it('should throw error if not passed name in opts', () => {
    expect(() => {
      new _.Resolver({});
    }).toThrowError();
  });
  it('should have getDescription/setDescription methods', () => {
    resolver.setDescription('Find users');
    expect(resolver.getDescription()).toBe('Find users');
  });
  it('should have getKind/setKind methods', () => {
    resolver.setKind('query');
    expect(resolver.getKind()).toBe('query');
    expect(() => {
      resolver.setKind('unproperKind');
    }).toThrowError('You provide incorrect value');
  });
  describe('`type` methods', () => {
    it('should have setType/getType methods', () => {
      resolver.setType(_graphql.GraphQLString);
      expect(resolver.getType()).toBe(_graphql.GraphQLString);
      expect(() => {
        resolver.setType(new _graphql.GraphQLInputObjectType({
          name: 'MyInput',
          fields: () => ({})
        }));
      }).toThrowError();
    });
    it('should convert type as string to GraphQLType', () => {
      const myResolver = new _.Resolver({
        name: 'myResolver',
        type: 'String!'
      });
      const type = myResolver.getType();
      expect(type).toBeInstanceOf(_graphql.GraphQLNonNull);
      expect(type.ofType).toBe(_graphql.GraphQLString);
    });
    it('should convert type definition to GraphQLType', () => {
      const myResolver = new _.Resolver({
        name: 'myResolver',
        type: `
          type SomeType {
            name: String
          }
        `
      });
      const type = myResolver.getType();
      expect(type).toBeInstanceOf(_graphql.GraphQLObjectType);
      expect(type.name).toBe('SomeType');
    });
    it('should accept TypeComposer for `type` option', () => {
      const typeTC = _.TypeComposer.create('type SomeType22 { test: String }');

      const myResolver = new _.Resolver({
        name: 'myResolver',
        type: typeTC
      });
      const type = myResolver.getType();
      expect(type).toBeInstanceOf(_graphql.GraphQLObjectType);
      expect(type.name).toBe('SomeType22');
    });
    it('should throw error on InputTypeComposer for `type` option', () => {
      const someInputITC = _.InputTypeComposer.create('input SomeInputType { add: String }');

      expect(() => {
        new _.Resolver({
          name: 'myResolver',
          type: someInputITC
        });
      }).toThrowError('InputTypeComposer');
    });
    it('should accept Resolver for `type` option', () => {
      const someOtherResolver = new _.Resolver({
        name: 'someOtherResolver',
        type: `
          type SomeType {
            name: String
          }
        `
      });
      const myResolver = new _.Resolver({
        name: 'myResolver',
        type: someOtherResolver
      });
      const type = myResolver.getType();
      expect(type).toBeInstanceOf(_graphql.GraphQLObjectType);
      expect(type.name).toBe('SomeType');
    });
    it('should accept array for `type` option', () => {
      const myResolver = new _.Resolver({
        name: 'myResolver',
        type: ['String']
      });
      const type = myResolver.getType();
      expect(type).toBeInstanceOf(_graphql.GraphQLList);
      expect(type.ofType).toBe(_graphql.GraphQLString);
    });
    it('should have wrapType() method', () => {
      const newResolver = resolver.wrapType(prevType => {
        return 'String';
      });
      expect(newResolver.getType()).toBe(_graphql.GraphQLString);
    });
  });
  describe('`args` methods', () => {
    it('should have setArg and getArg methods', () => {
      resolver.setArg('a1', {
        type: _graphql.GraphQLString
      });
      expect(resolver.getArgType('a1')).toBe(_graphql.GraphQLString);
      resolver.setArg('a2', {
        type: 'String'
      });
      expect(resolver.getArgType('a2')).toBe(_graphql.GraphQLString);
      resolver.setArg('a3', 'String');
      expect(resolver.getArgType('a3')).toBe(_graphql.GraphQLString);
    });
    it('should have setArgs method', () => {
      resolver.setArgs({
        b1: {
          type: _graphql.GraphQLString
        },
        b2: {
          type: 'String'
        },
        b3: 'String'
      });
      expect(resolver.getArgType('b1')).toBe(_graphql.GraphQLString);
      expect(resolver.getArgType('b2')).toBe(_graphql.GraphQLString);
      expect(resolver.getArgType('b3')).toBe(_graphql.GraphQLString);
    });
    it('should have getArgType method', () => {
      resolver.setArgs({
        b1: 'String'
      });
      expect(resolver.getArgType('b1')).toBe(_graphql.GraphQLString);
      expect(() => resolver.getArgType('unexisted')).toThrowError();
    });
    it('should return undefined for non-existing arg', () => {
      expect(resolver.hasArg('unexisted')).toBeFalsy();
    });
    it('should remove args', () => {
      const argName = 'argField';
      const argConfig = {
        type: _graphql.GraphQLString
      };
      resolver.setArg(argName, argConfig);
      resolver.removeArg(argName);
      expect(resolver.hasArg(argName)).toBeFalsy();
      resolver.setArg('a1', 'String');
      resolver.setArg('a2', 'String');
      resolver.setArg('a3', 'String');
      resolver.removeArg(['a1', 'a2']);
      expect(resolver.hasArg('a1')).toBeFalsy();
      expect(resolver.hasArg('a2')).toBeFalsy();
      expect(resolver.hasArg('a3')).toBeTruthy();
    });
    it('should remove other args', () => {
      resolver.setArg('a1', 'String');
      resolver.setArg('a2', 'String');
      resolver.removeOtherArgs('a1');
      expect(resolver.hasArg('a1')).toBeTruthy();
      expect(resolver.hasArg('a2')).toBeFalsy();
      resolver.setArg('a1', 'String');
      resolver.setArg('a2', 'String');
      resolver.setArg('a3', 'String');
      resolver.removeOtherArgs(['a1', 'a2']);
      expect(resolver.hasArg('a1')).toBeTruthy();
      expect(resolver.hasArg('a2')).toBeTruthy();
      expect(resolver.hasArg('a3')).toBeFalsy();
    });
    it('should add args', () => {
      resolver.setArgs({
        b1: 'String'
      });
      resolver.addArgs({
        b2: 'String',
        b3: 'String'
      });
      expect(resolver.hasArg('b1')).toBe(true);
      expect(resolver.hasArg('b2')).toBe(true);
      expect(resolver.hasArg('b3')).toBe(true);
    });
    it('should have wrapArgs() method', () => {
      const newResolver = resolver.wrapArgs(prevArgs => {
        return _objectSpread({}, prevArgs, {
          arg1: 'String'
        });
      });
      expect(newResolver.getArgType('arg1')).toBe(_graphql.GraphQLString);
    });
    it('should make args required', () => {
      resolver.setArgs({
        b1: {
          type: _graphql.GraphQLString
        },
        b2: {
          type: 'String'
        },
        b3: 'String',
        b4: 'String'
      });
      resolver.makeRequired('b1');
      resolver.makeRequired(['b2', 'b3']);
      expect(resolver.isRequired('b1')).toBe(true);
      expect(resolver.getArgType('b1')).toBeInstanceOf(_graphql.GraphQLNonNull);
      expect(resolver.isRequired('b2')).toBe(true);
      expect(resolver.isRequired('b3')).toBe(true);
      expect(resolver.isRequired('b4')).toBe(false);
    });
    it('should make args optional', () => {
      resolver.setArgs({
        b1: {
          type: new _graphql.GraphQLNonNull(_graphql.GraphQLString)
        },
        b2: {
          type: 'String!'
        },
        b3: 'String!',
        b4: 'String!'
      });
      resolver.makeOptional('b1');
      resolver.makeOptional(['b2', 'b3']);
      expect(resolver.isRequired('b1')).toBe(false);
      expect(resolver.getArgType('b1')).toBe(_graphql.GraphQLString);
      expect(resolver.isRequired('b2')).toBe(false);
      expect(resolver.isRequired('b3')).toBe(false);
      expect(resolver.isRequired('b4')).toBe(true);
    });
    describe('reorderArgs()', () => {
      it('should change args order', () => {
        resolver.setArgs({
          a1: 'Int',
          a2: 'Int',
          a3: 'Int'
        });
        expect(resolver.getArgNames().join(',')).toBe('a1,a2,a3');
        resolver.reorderArgs(['a3', 'a2', 'a1']);
        expect(resolver.getArgNames().join(',')).toBe('a3,a2,a1');
      });
      it('should append not listed args', () => {
        resolver.setArgs({
          a1: 'Int',
          a2: 'Int',
          a3: 'Int'
        });
        expect(resolver.getArgNames().join(',')).toBe('a1,a2,a3');
        resolver.reorderArgs(['a3']);
        expect(resolver.getArgNames().join(',')).toBe('a3,a1,a2');
      });
      it('should skip non existed args', () => {
        resolver.setArgs({
          a1: 'Int',
          a2: 'Int',
          a3: 'Int'
        });
        expect(resolver.getArgNames().join(',')).toBe('a1,a2,a3');
        resolver.reorderArgs(['a22', 'a3', 'a55', 'a1', 'a2']);
        expect(resolver.getArgNames().join(',')).toBe('a3,a1,a2');
      });
    });
    describe('cloneArg()', () => {
      beforeEach(() => {
        resolver.setArgs({
          scalar: 'String',
          filter: {
            type: `input FilterInput {
              name: String,
              age: Int,
            }`,
            description: 'Data filtering arg'
          },
          mandatory: {
            type: `input Mandatory {
              data: String
            }`
          },
          mandatoryScalar: 'String!'
        });
        resolver.makeRequired('mandatory');
      });
      it('should throw error if arg does not exists', () => {
        expect(() => {
          resolver.cloneArg('missingArg', 'NewTypeNameInput');
        }).toThrowError('Argument does not exist');
      });
      it('should throw error if arg is GraphqlNonNull wrapped scalar type', () => {
        expect(() => {
          resolver.cloneArg('mandatoryScalar', 'NewTypeNameInput');
        }).toThrowError('should be GraphQLInputObjectType');
      });
      it('should throw error if arg is scalar type', () => {
        expect(() => {
          resolver.cloneArg('scalar', 'NewTypeNameInput');
        }).toThrowError('should be GraphQLInputObjectType');
      });
      it('should throw error if provided incorrect new type name', () => {
        expect(() => {
          resolver.cloneArg('filter', '');
        }).toThrowError('should provide new type name');
        expect(() => {
          resolver.cloneArg('filter', '#3fdsf');
        }).toThrowError('should provide new type name');
        expect(() => {
          resolver.cloneArg('filter', 'FilterInput');
        }).toThrowError('It is equal to current name');
      });
      it('should clone GraphqlNonNull wrapped types', () => {
        resolver.cloneArg('mandatory', 'NewMandatory');
        expect(resolver.getArgType('mandatory').ofType.name).toBe('NewMandatory');
      });
      it('should clone arg type', () => {
        resolver.cloneArg('filter', 'NewFilterInput');
        expect(resolver.getArgType('filter').name).toBe('NewFilterInput');
        expect(resolver.getArgConfig('filter').description).toBe('Data filtering arg');
      });
    });
    it('should work with arg as thunk', () => {
      resolver.setArgs({
        a: () => 'String',
        b: () => _.InputTypeComposer.create(`input ArgAsThunk1 { b: Int }`),
        c: () => (0, _graphql.GraphQLNonNull)(_.InputTypeComposer.create(`input ArgAsThunk2 { b: Int }`).getType())
      });
      expect(resolver.getArgType('a')).toBe(_graphql.GraphQLString);
      expect(resolver.getArgType('b').name).toBe('ArgAsThunk1');
      expect(resolver.getArgTC('c')).toBeInstanceOf(_.InputTypeComposer);
      expect(resolver.getArgTC('c').getTypeName()).toBe('ArgAsThunk2');
    });
  });
  describe('getFieldConfig()', () => {
    it('should return fieldConfig', () => {
      const fc = resolver.getFieldConfig();
      expect(fc).toHaveProperty('type');
      expect(fc).toHaveProperty('args');
      expect(fc).toHaveProperty('description');
      expect(fc).toHaveProperty('resolve');
    });
    it('should combine all resolve args to resolveParams', () => {
      let rp;

      resolver.resolve = resolveParams => {
        rp = resolveParams;
      };

      const fc = resolver.getFieldConfig();
      fc.resolve('sourceData', 'argsData', 'contextData', 'infoData');
      expect(rp).toHaveProperty('source', 'sourceData');
      expect(rp).toHaveProperty('args', 'argsData');
      expect(rp).toHaveProperty('context', 'contextData');
      expect(rp).toHaveProperty('info', 'infoData');
    });
    it('should create `projection` property', () => {
      let rp;

      resolver.resolve = resolveParams => {
        rp = resolveParams;
      };

      const fc = resolver.getFieldConfig();
      fc.resolve();
      expect(rp).toHaveProperty('projection');
    });
    it('should resolve args configs as thunk', () => {
      let rp;
      resolver.setArgs({
        arg1: 'String',
        arg2: () => 'String',
        arg3: {
          type: () => 'String'
        }
      });
      const fc = resolver.getFieldConfig();
      expect(fc.args.arg1.type).toBe(_graphql.GraphQLString);
      expect(fc.args.arg2.type).toBe(_graphql.GraphQLString);
      expect(fc.args.arg3.type).toBe(_graphql.GraphQLString);
    });
  });
  describe('wrap()', () => {
    it('should return new resolver', () => {
      const newResolver = resolver.wrap();
      expect(newResolver).toBeInstanceOf(_.Resolver);
      expect(newResolver).not.toBe(resolver);
    });
    it('should set internal name', () => {
      expect(resolver.wrap().name).toBe('wrap');
      expect(resolver.wrap(r => r, {
        name: 'crazyWrap'
      }).name).toBe('crazyWrap');
    });
    it('should keep ref to source resolver in parent property', () => {
      expect(resolver.wrap().parent).toBe(resolver);
    });
    it('should return resolver from callback, cause it can be overridden there', () => {
      const customResolver = new _.Resolver({
        name: 'find'
      });
      expect(resolver.wrap((newResolver, prevResolver) => {
        // eslint-disable-line
        return customResolver;
      })).toBe(customResolver);
    });
  });
  describe('wrapCloneArg()', () => {
    let newResolver;
    beforeEach(() => {
      resolver.setArgs({
        other: '[String]',
        filter: {
          type: `input FilterInput {
            name: String,
            age: Int,
          }`,
          description: 'Data filtering arg'
        },
        mandatory: {
          type: `input Mandatory {
            data: String
          }`
        }
      });
      resolver.makeRequired('mandatory');
      newResolver = resolver.wrapCloneArg('filter', 'NewFilterInput').wrapCloneArg('mandatory', 'NewMandatory');
    });
    it('should return new resolver', () => {
      expect(newResolver).not.toBe(resolver);
    });
    it('should clone type for argument', () => {
      expect(newResolver.getArg('filter')).not.toBe(resolver.getArg('filter'));
      expect(newResolver.getArgType('filter')).not.toBe(resolver.getArgType('filter'));
    });
    it('should change wrapped cloned type names', () => {
      const filterType = newResolver.getArgType('filter');
      expect(filterType.name).toBe('NewFilterInput');
      expect(filterType.name).not.toBe(resolver.getArgType('filter').name);
    });
    it('should keep untouched other args', () => {
      expect(newResolver.getArg('other')).toBe(resolver.getArg('other'));
      expect(newResolver.getArgType('other')).not.toBe(resolver.getArgType('other'));
    });
    it('should unwrap GraphQLNonNull types', () => {
      expect(newResolver.getArg('mandatory')).not.toBe(resolver.getArg('mandatory'));
      expect(newResolver.getArgType('mandatory')).not.toBe(resolver.getArgType('mandatory'));
    });
    it('should change wrapped cloned type names', () => {
      const mandatoryType = newResolver.getArgType('mandatory');
      expect(mandatoryType.ofType.name).toBe('NewMandatory');
      expect(mandatoryType.ofType.name).not.toBe(resolver.getArgType('mandatory').ofType.name);
    });
  });
  it('should return data from resolve',
  /*#__PURE__*/
  _asyncToGenerator(function* () {
    const myResolver = new _.Resolver({
      name: 'customResolver',
      resolve: () => ({
        name: 'Nodkz'
      }),
      type: `
        type SomeType {
          name: String
        }
      `
    });

    _schemaComposer.default.rootQuery().addRelation('resolveUser', {
      resolver: () => myResolver,
      projection: {
        _id: true
      }
    });

    const schema = _schemaComposer.default.buildSchema();

    const result = yield (0, _graphql.graphql)(schema, '{ resolveUser { name } }');
    expect(result).toEqual({
      data: {
        resolveUser: {
          name: 'Nodkz'
        }
      }
    });
  }));
  describe('addFilterArg', () => {
    it('should add arg to filter and setup default value', () => {
      const newResolver = resolver.addFilterArg({
        name: 'age',
        type: 'Int!',
        defaultValue: 20,
        description: 'Age filter',
        filterTypeNameFallback: 'FilterUniqueNameInput'
      });
      expect(resolver.hasArg('filter')).toBeFalsy();
      const filterCfg = newResolver.getArgConfig('filter');
      expect(filterCfg).toBeTruthy();
      expect(filterCfg.type).toBeInstanceOf(_graphql.GraphQLInputObjectType);
      expect(filterCfg.defaultValue).toEqual({
        age: 20
      });
      const filterITC = new _.InputTypeComposer(filterCfg.type);
      expect(filterITC.getField('age').description).toBe('Age filter');
      const ageType = filterITC.getFieldType('age');
      expect(ageType).toBeInstanceOf(_graphql.GraphQLNonNull);
      expect(ageType.ofType).toBe(_graphql.GraphQLInt);
    });
    it('should prepare resolveParams.rawQuery when `resolve` called',
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      let rpSnap;
      const resolve = resolver.resolve;

      resolver.resolve = rp => {
        rpSnap = rp;
        return resolve(rp);
      };

      const newResolver = resolver.addFilterArg({
        name: 'age',
        type: 'Int!',
        description: 'Age filter',
        query: (_query, value, resolveParams) => {
          _query.age = {
            $gt: value
          }; // eslint-disable-line no-param-reassign

          _query.someKey = resolveParams.someKey; // eslint-disable-line no-param-reassign
        },
        filterTypeNameFallback: 'FilterUniqueNameInput'
      }).addFilterArg({
        name: 'isActive',
        type: 'Boolean!',
        description: 'Active status filter',
        query: function () {
          var _query3 = _asyncToGenerator(function* (_query2, value, resolveParams) {
            _query2.checkPermissions = yield Promise.resolve('accessGranted'); // eslint-disable-line no-param-reassign

            _query2.isActive = value; // eslint-disable-line no-param-reassign
          });

          function query(_x, _x2, _x3) {
            return _query3.apply(this, arguments);
          }

          return query;
        }(),
        filterTypeNameFallback: 'FilterOtherUniqueNameInput'
      });
      yield newResolver.resolve({
        args: {
          filter: {
            age: 15,
            isActive: false
          }
        },
        someKey: 16
      });
      expect(rpSnap.rawQuery).toEqual({
        age: {
          $gt: 15
        },
        isActive: false,
        someKey: 16,
        checkPermissions: 'accessGranted'
      });
    }));
    it('should extend default value', () => {
      resolver.setArg('filter', {
        type: new _graphql.GraphQLInputObjectType({
          name: 'MyFilterInput',
          fields: {
            name: {
              type: _graphql.GraphQLString
            }
          }
        }),
        defaultValue: {
          name: 'User'
        }
      });
      const newResolver = resolver.addFilterArg({
        name: 'age',
        type: 'Int',
        defaultValue: 33,
        filterTypeNameFallback: 'FilterUniqueNameInput'
      });
      expect(newResolver.getArgConfig('filter').defaultValue).toEqual({
        name: 'User',
        age: 33
      });
    });
    it('should throw errors if provided incorrect options', () => {
      expect(() => {
        resolver.addFilterArg({});
      }).toThrowError('`opts.name` is required');
      expect(() => {
        resolver.addFilterArg({
          name: 'price'
        });
      }).toThrowError('`opts.type` is required');
      expect(() => {
        resolver.addFilterArg({
          name: 'price',
          type: 'input {min: Int}'
        });
      }).toThrowError('opts.filterTypeNameFallback: string');
    });
  });
  it('should return nested name for Resolver', () => {
    const r1 = new _.Resolver({
      name: 'find'
    });
    const r2 = r1.wrapResolve(next => resolveParams => {
      // eslint-disable-line
      return 'function code';
    });
    expect(r1.getNestedName()).toBe('find');
    expect(r2.getNestedName()).toBe('wrapResolve(find)');
  });
  it('should on toString() call provide debug info with source code', () => {
    const r1 = new _.Resolver({
      name: 'find'
    });
    const r2 = r1.wrapResolve(next => resolveParams => {
      // eslint-disable-line
      return 'function code';
    });
    expect(r2.toString()).toContain('function code');
  });
  it('should return type by path', () => {
    const rsv = new _.Resolver({
      name: 'find',
      type: 'type LonLat { lon: Float, lat: Float }',
      args: {
        distance: 'Int!'
      }
    });
    expect(rsv.get('lat')).toBe(_graphql.GraphQLFloat);
    expect(rsv.get('@distance')).toBe(_graphql.GraphQLInt);
  });
  describe('addSortArg', () => {
    it('should extend SortEnum by new value', () => {
      resolver.setArg('sort', {
        type: new _graphql.GraphQLEnumType({
          name: 'MySortEnum',
          values: {
            AGE_ASC: {}
          }
        })
      });
      const newResolver = resolver.addSortArg({
        name: 'PRICE_ASC',
        description: 'Asc sort by non-null price',
        value: {
          price: 1
        }
      });
      const sortEnum = newResolver.getArgType('sort');
      expect(sortEnum.parseValue('AGE_ASC')).toBe('AGE_ASC');
      expect(sortEnum.parseValue('PRICE_ASC')).toEqual({
        price: 1
      });
    });
    it('should prepare sort value when `resolve` called', () => {
      let rpSnap;
      const resolve = resolver.resolve;

      resolver.resolve = rp => {
        rpSnap = rp;
        return resolve(rp);
      };

      let whereSnap;
      const query = {
        where: condition => {
          whereSnap = condition;
        }
      };
      const newResolver = resolver.addSortArg({
        name: 'PRICE_ASC',
        description: 'Asc sort by non-null price',
        value: resolveParams => {
          resolveParams.query.where({
            price: {
              $gt: 0
            }
          }); // eslint-disable-line no-param-reassign

          return {
            price: 1
          };
        },
        sortTypeNameFallback: 'SortEnum'
      });
      newResolver.resolve({
        args: {
          sort: 'PRICE_ASC'
        },
        query
      });
      expect(rpSnap.args.sort).toEqual({
        price: 1
      });
      expect(whereSnap).toEqual({
        price: {
          $gt: 0
        }
      });
    });
    it('should work with arg defined as TypeStringDefinition', () => {
      resolver.setArg('sort', `enum CustomEnum { ID_ASC, ID_DESC }`);
      resolver.addSortArg({
        name: 'PRICE_ASC',
        value: 123
      });
      const sortType = resolver.getArgType('sort');

      const etc = _.EnumTypeComposer.create(sortType);

      expect(etc.getFieldNames()).toEqual(['ID_ASC', 'ID_DESC', 'PRICE_ASC']);
    });
    it('should throw errors if provided incorrect options', () => {
      expect(() => {
        resolver.addSortArg({});
      }).toThrowError('`opts.name` is required');
      expect(() => {
        resolver.addSortArg({
          name: 'PRICE_ASC'
        });
      }).toThrowError('`opts.value` is required');
      expect(() => {
        resolver.addSortArg({
          name: 'PRICE_ASC',
          value: 123
        });
      }).toThrowError('opts.sortTypeNameFallback: string');
      expect(() => {
        resolver.setArg('sort', {
          type: _graphql.GraphQLInt
        });
        resolver.addSortArg({
          name: 'PRICE_ASC',
          value: 123
        });
      }).toThrowError('must have `sort` arg with type GraphQLEnumType');
    });
  });
  it('should have chainable methods', () => {
    expect(resolver.setArgs({})).toBe(resolver);
    expect(resolver.setArg('a1', 'String')).toBe(resolver);
    expect(resolver.addArgs({
      a2: 'input LL { f1: Int, f2: Int }'
    })).toBe(resolver);
    expect(resolver.removeArg('a1')).toBe(resolver);
    expect(resolver.removeOtherArgs('a2')).toBe(resolver);
    expect(resolver.reorderArgs(['a1'])).toBe(resolver);
    expect(resolver.cloneArg('a2', 'NewTypeName')).toBe(resolver);
    expect(resolver.makeRequired('a2')).toBe(resolver);
    expect(resolver.makeOptional('a2')).toBe(resolver);
    expect(resolver.setResolve(() => {})).toBe(resolver);
    expect(resolver.setType('String')).toBe(resolver);
    expect(resolver.setKind('query')).toBe(resolver);
    expect(resolver.setDescription('Find method')).toBe(resolver);
  });
  describe('debug methods', () => {
    /* eslint-disable no-console */
    const origConsole = global.console;
    beforeEach(() => {
      global.console = {
        log: jest.fn(),
        dir: jest.fn(),
        time: jest.fn(),
        timeEnd: jest.fn()
      };
    });
    afterEach(() => {
      global.console = origConsole;
    });
    describe('debugExecTime()', () => {
      it('should measure execution time',
      /*#__PURE__*/
      _asyncToGenerator(function* () {
        const r1 = new _.Resolver({
          name: 'find',
          displayName: 'User.find()',
          resolve: () => {}
        });
        yield r1.debugExecTime().resolve();
        expect(console.time.mock.calls[0]).toEqual(['Execution time for User.find()']);
        expect(console.timeEnd.mock.calls[0]).toEqual(['Execution time for User.find()']);
      }));
    });
    describe('debugParams()', () => {
      it('should show resolved payload', () => {
        const r1 = new _.Resolver({
          name: 'find',
          displayName: 'User.find()',
          resolve: () => {}
        });
        r1.debugParams().resolve({
          source: {
            id: 1
          },
          args: {
            limit: 1
          },
          context: {
            isAdmin: true,
            db: {}
          },
          info: {
            fieldName: 'a',
            otherAstFields: {}
          }
        });
        expect(console.log.mock.calls[0]).toEqual(['ResolveParams for User.find():']);
        expect(console.dir.mock.calls[0]).toEqual([{
          args: {
            limit: 1
          },
          context: {
            db: 'Object {} [[hidden]]',
            isAdmin: true
          },
          info: 'Object {} [[hidden]]',
          source: {
            id: 1
          },
          '[debug note]': 'Some data was [[hidden]] to display this fields use debugParams("info context.db")'
        }, {
          colors: true,
          depth: 5
        }]);
      });
      it('should show filtered resolved payload', () => {
        const r1 = new _.Resolver({
          name: 'find',
          displayName: 'User.find()',
          resolve: () => {}
        });
        r1.debugParams('args, args.sort, source.name').resolve({
          source: {
            id: 1,
            name: 'Pavel'
          },
          args: {
            limit: 1,
            sort: 'id'
          }
        });
        expect(console.log.mock.calls[0]).toEqual(['ResolveParams for User.find():']);
        expect(console.dir.mock.calls[0]).toEqual([{
          args: {
            limit: 1,
            sort: 'id'
          },
          'args.sort': 'id',
          'source.name': 'Pavel'
        }, {
          colors: true,
          depth: 5
        }]);
      });
    });
    describe('debugPayload()', () => {
      it('should show resolved payload',
      /*#__PURE__*/
      _asyncToGenerator(function* () {
        const r1 = new _.Resolver({
          name: 'find',
          displayName: 'User.find()',
          resolve: function () {
            var _resolve = _asyncToGenerator(function* () {
              return {
                a: 123
              };
            });

            function resolve() {
              return _resolve.apply(this, arguments);
            }

            return resolve;
          }()
        });
        yield r1.debugPayload().resolve();
        expect(console.log.mock.calls[0]).toEqual(['Resolved Payload for User.find():']);
        expect(console.dir.mock.calls[0]).toEqual([{
          a: 123
        }, {
          colors: true,
          depth: 5
        }]);
      }));
      it('should show filtered resolved payload',
      /*#__PURE__*/
      _asyncToGenerator(function* () {
        const r1 = new _.Resolver({
          name: 'find',
          displayName: 'User.find()',
          resolve: function () {
            var _resolve2 = _asyncToGenerator(function* () {
              return {
                a: 123,
                b: 345,
                c: [0, 1, 2, 3]
              };
            });

            function resolve() {
              return _resolve2.apply(this, arguments);
            }

            return resolve;
          }()
        });
        yield r1.debugPayload(['b', 'c.3']).resolve();
        expect(console.log.mock.calls[0]).toEqual(['Resolved Payload for User.find():']);
        expect(console.dir.mock.calls[0]).toEqual([{
          b: 345,
          'c.3': 3
        }, {
          colors: true,
          depth: 5
        }]);
      }));
      it('should show rejected payload',
      /*#__PURE__*/
      _asyncToGenerator(function* () {
        const err = new Error('Request failed');
        const r1 = new _.Resolver({
          name: 'find',
          displayName: 'User.find()',
          resolve: function () {
            var _resolve3 = _asyncToGenerator(function* () {
              throw err;
            });

            function resolve() {
              return _resolve3.apply(this, arguments);
            }

            return resolve;
          }()
        });
        yield r1.debugPayload().resolve().catch(e => {});
        expect(console.log.mock.calls[0]).toEqual(['Rejected Payload for User.find():']);
        expect(console.log.mock.calls[1]).toEqual([err]);
      }));
    });
    describe('debug()', () => {
      it('should output execution time, resolve params and payload',
      /*#__PURE__*/
      _asyncToGenerator(function* () {
        const r1 = new _.Resolver({
          name: 'find',
          displayName: 'User.find()',
          resolve: () => ({
            a: 123,
            b: 345,
            c: [0, 1, 2, 3]
          })
        });
        yield r1.debug({
          params: 'args.sort source.name',
          payload: 'b, c.3'
        }).resolve({
          source: {
            id: 1,
            name: 'Pavel'
          },
          args: {
            limit: 1,
            sort: 'id'
          }
        });
        expect(console.time.mock.calls[0]).toEqual(['Execution time for User.find()']);
        expect(console.timeEnd.mock.calls[0]).toEqual(['Execution time for User.find()']);
        expect(console.log.mock.calls[0]).toEqual(['ResolveParams for debugExecTime(User.find()):']);
        expect(console.dir.mock.calls[0]).toEqual([{
          'args.sort': 'id',
          'source.name': 'Pavel'
        }, {
          colors: true,
          depth: 2
        }]);
        expect(console.log.mock.calls[1]).toEqual(['Resolved Payload for debugParams(debugExecTime(User.find())):']);
        expect(console.dir.mock.calls[1]).toEqual([{
          b: 345,
          'c.3': 3
        }, {
          colors: true,
          depth: 2
        }]);
      }));
    });
    /* eslint-enable no-console */
  });
  describe('getArgTC()', () => {
    const myResolver = new _.Resolver({
      name: 'someResolver',
      type: 'String',
      args: {
        scalar: 'String',
        list: '[Int]',
        obj: _.InputTypeComposer.create(`input RCustomInputType { name: String }`),
        objArr: [_.InputTypeComposer.create(`input RCustomInputType2 { name: String }`)]
      }
    });
    it('should return InputTypeComposer for object argument', () => {
      const objTC = myResolver.getArgTC('obj');
      expect(objTC.getTypeName()).toBe('RCustomInputType');
    });
    it('should return InputTypeComposer for wrapped object argument', () => {
      const objTC = myResolver.getArgTC('objArr');
      expect(objTC.getTypeName()).toBe('RCustomInputType2');
    });
    it('should throw error for non-object argument', () => {
      expect(() => {
        myResolver.getArgTC('scalar');
      }).toThrow('argument should be InputObjectType');
      expect(() => {
        myResolver.getArgTC('list');
      }).toThrow('argument should be InputObjectType');
    });
  });
  describe('getTypeComposer()', () => {
    it('should return TypeComposer for GraphQLObjectType', () => {
      const r = new _.Resolver({
        name: 'find',
        type: `type MyOutputType { name: String }`,
        displayName: 'User.find()',
        resolve: () => {}
      });
      expect(r.getType()).toBeInstanceOf(_graphql.GraphQLObjectType);
      expect(r.getTypeComposer()).toBeInstanceOf(_.TypeComposer);
      expect(r.getTypeComposer().getTypeName()).toBe('MyOutputType');
    });
    it('should unwrap List and NonNull GraphQLObjectType', () => {
      _.TypeComposer.create(`type MyOutputType { name: String }`);

      const r = new _.Resolver({
        name: 'find',
        type: '[MyOutputType!]!',
        displayName: 'User.find()',
        resolve: () => {}
      });
      expect(r.type).toBe('[MyOutputType!]!');
      const type = r.getType();
      expect(type).toBeInstanceOf(_graphql.GraphQLNonNull);
      expect(type.ofType).toBeInstanceOf(_graphql.GraphQLList);
      expect(r.getTypeComposer()).toBeInstanceOf(_.TypeComposer);
      expect(r.getTypeComposer().getTypeName()).toBe('MyOutputType');
    });
    it('should throw error if output type is not GraphQLObjectType', () => {
      const r = new _.Resolver({
        name: 'find',
        type: 'String',
        displayName: 'User.find()',
        resolve: () => {}
      });
      expect(r.type).toBe('String');
      expect(r.getType()).toBe(_graphql.GraphQLString);
      expect(() => r.getTypeComposer()).toThrow();
    });
  });
});
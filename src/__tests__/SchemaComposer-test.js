/* @flow strict */

import { SchemaComposer } from '..';
import { TypeComposer } from '../TypeComposer';
import { InputTypeComposer } from '../InputTypeComposer';
import { EnumTypeComposer } from '../EnumTypeComposer';
import { InterfaceTypeComposer } from '../InterfaceTypeComposer';
import {
  graphql,
  GraphQLString,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLEnumType,
} from '../graphql';

describe('SchemaComposer', () => {
  it('should implements `add` method', () => {
    const sc = new SchemaComposer();
    const SomeTC = sc.TypeComposer.create({ name: 'validType' });
    sc.add(SomeTC);
    expect(sc.get('validType')).toBe(SomeTC);
  });

  it('should implements `get` method', () => {
    const sc = new SchemaComposer();
    const SomeTC = sc.TypeComposer.create({ name: 'validType' });
    sc.add(SomeTC);
    expect(sc.get('validType')).toBe(SomeTC);
  });

  it('should implements `has` method`', () => {
    const sc = new SchemaComposer();
    const SomeTC = sc.TypeComposer.create({ name: 'validType' });
    sc.add(SomeTC);
    expect(sc.has('validType')).toBe(true);
    expect(sc.has('unexistedType')).toBe(false);
  });

  describe('getOrCreateTC()', () => {
    it('should create TC if not exists', () => {
      const sc = new SchemaComposer();
      const UserTC = sc.getOrCreateTC('User');
      expect(UserTC).toBeInstanceOf(TypeComposer);
      expect(sc.has('User')).toBeTruthy();
      expect(sc.hasInstance('User', TypeComposer)).toBeTruthy();
      expect(sc.getTC('User')).toBe(UserTC);
    });

    it('should create TC if not exists with onCreate', () => {
      const sc = new SchemaComposer();
      const UserTC = sc.getOrCreateTC('User', tc => {
        tc.setDescription('User model');
      });
      expect(UserTC.getDescription()).toBe('User model');
    });

    it('should return already created TC without onCreate', () => {
      const sc = new SchemaComposer();
      const UserTC = sc.getOrCreateTC('User', tc => {
        tc.setDescription('User model');
      });
      const UserTC2 = sc.getOrCreateTC('User', tc => {
        tc.setDescription('updated description');
      });
      expect(UserTC).toBe(UserTC2);
      expect(UserTC.getDescription()).toBe('User model');
    });
  });

  describe('getOrCreateITC()', () => {
    it('should create ITC if not exists', () => {
      const sc = new SchemaComposer();
      const UserITC = sc.getOrCreateITC('UserInput');
      expect(UserITC).toBeInstanceOf(InputTypeComposer);
      expect(sc.has('UserInput')).toBeTruthy();
      expect(sc.hasInstance('UserInput', InputTypeComposer)).toBeTruthy();
      expect(sc.getITC('UserInput')).toBe(UserITC);
    });

    it('should create ITC if not exists with onCreate', () => {
      const sc = new SchemaComposer();
      const UserITC = sc.getOrCreateITC('UserInput', tc => {
        tc.setDescription('User input');
      });
      expect(UserITC.getDescription()).toBe('User input');
    });

    it('should return already created ITC without onCreate', () => {
      const sc = new SchemaComposer();
      const UserITC = sc.getOrCreateITC('UserInput', tc => {
        tc.setDescription('User input');
      });
      const UserITC2 = sc.getOrCreateITC('UserInput', tc => {
        tc.setDescription('updated description');
      });
      expect(UserITC).toBe(UserITC2);
      expect(UserITC.getDescription()).toBe('User input');
    });
  });

  describe('getOrCreateETC()', () => {
    it('should create ETC if not exists', () => {
      const sc = new SchemaComposer();
      const UserETC = sc.getOrCreateETC('UserEnum');
      expect(UserETC).toBeInstanceOf(EnumTypeComposer);
      expect(sc.has('UserEnum')).toBeTruthy();
      expect(sc.hasInstance('UserEnum', EnumTypeComposer)).toBeTruthy();
      expect(sc.getETC('UserEnum')).toBe(UserETC);
    });

    it('should create ETC if not exists with onCreate', () => {
      const sc = new SchemaComposer();
      const UserETC = sc.getOrCreateETC('UserEnum', tc => {
        tc.setDescription('User enum');
      });
      expect(UserETC.getDescription()).toBe('User enum');
    });

    it('should return already created ETC without onCreate', () => {
      const sc = new SchemaComposer();
      const UserETC = sc.getOrCreateETC('UserEnum', tc => {
        tc.setDescription('User enum');
      });
      const UserETC2 = sc.getOrCreateETC('UserEnum', tc => {
        tc.setDescription('updated description');
      });
      expect(UserETC).toBe(UserETC2);
      expect(UserETC.getDescription()).toBe('User enum');
    });
  });

  describe('getOrCreateIFTC()', () => {
    it('should create IFTC if not exists', () => {
      const sc = new SchemaComposer();
      const UserIFTC = sc.getOrCreateIFTC('UserInterface');
      expect(UserIFTC).toBeInstanceOf(InterfaceTypeComposer);
      expect(sc.has('UserInterface')).toBeTruthy();
      expect(sc.hasInstance('UserInterface', InterfaceTypeComposer)).toBeTruthy();
      expect(sc.getIFTC('UserInterface')).toBe(UserIFTC);
    });

    it('should create IFTC if not exists with onCreate', () => {
      const sc = new SchemaComposer();
      const UserIFTC = sc.getOrCreateIFTC('UserInterface', tc => {
        tc.setDescription('User interface');
      });
      expect(UserIFTC.getDescription()).toBe('User interface');
    });

    it('should return already created IFTC without onCreate', () => {
      const sc = new SchemaComposer();
      const UserIFTC = sc.getOrCreateIFTC('UserInterface', tc => {
        tc.setDescription('User interface');
      });
      const UserIFTC2 = sc.getOrCreateIFTC('UserInterface', tc => {
        tc.setDescription('updated description');
      });
      expect(UserIFTC).toBe(UserIFTC2);
      expect(UserIFTC.getDescription()).toBe('User interface');
    });
  });

  describe('buildSchema()', () => {
    it('should throw error, if root fields not defined', () => {
      const sc = new SchemaComposer();
      sc.clear();

      expect(() => {
        sc.buildSchema();
      }).toThrowError();
    });

    it('should accept additional types', () => {
      const sc = new SchemaComposer();
      sc.Query.addFields({ time: 'Int' });
      const me1 = sc.TypeComposer.create('type Me1 { a: Int }').getType();
      const me2 = sc.TypeComposer.create('type Me2 { a: Int }').getType();
      const schema = sc.buildSchema({ types: [me1, me1, me2] });

      expect(schema._typeMap.Me1).toEqual(me1);
      expect(schema._typeMap.Me2).toEqual(me2);
    });

    it('should provide proper Schema when provided only Query', async () => {
      const sc = new SchemaComposer();
      sc.Query.addFields({ num: 'Int' });
      const schema = sc.buildSchema();
      expect(
        await graphql({
          schema,
          source: `
            query {
              num
            }
          `,
        })
      ).toEqual({ data: { num: null } });
    });

    it('should throw error if only Mutation provided', async () => {
      const sc = new SchemaComposer();
      sc.Mutation.addFields({ num: 'Int' });
      expect(() => {
        sc.buildSchema();
      }).toThrow('Must be initialized Query type');
    });
  });

  describe('removeEmptyTypes()', () => {
    it('should remove fields with Types which have no fields', () => {
      const sc = new SchemaComposer();
      const TypeWithoutFieldsTC = sc.getOrCreateTC('Stub');
      TypeWithoutFieldsTC.setFields({});

      const ViewerTC = sc.getOrCreateTC('Viewer');
      ViewerTC.setFields({
        name: 'String',
        stub: TypeWithoutFieldsTC,
      });

      /* eslint-disable */
      const oldConsoleLog = console.log;
      global.console.log = jest.fn();

      sc.removeEmptyTypes(ViewerTC);

      expect(console.log).lastCalledWith(
        "graphql-compose: Delete field 'Viewer.stub' with type 'Stub', cause it does not have fields."
      );
      global.console.log = oldConsoleLog;
      /* eslint-enable */

      expect(ViewerTC.hasField('stub')).toBe(false);
    });

    it('should not produce Maximum call stack size exceeded', () => {
      const sc = new SchemaComposer();
      const UserTC = sc.getOrCreateTC('User');
      UserTC.setField('friend', UserTC);

      sc.removeEmptyTypes(UserTC);
    });
  });

  describe('root type getters', () => {
    it('Query', () => {
      const sc = new SchemaComposer();
      expect(sc.Query).toBe(sc.rootQuery());
      expect(sc.Query.getTypeName()).toBe('Query');
    });

    it('Mutation', () => {
      const sc = new SchemaComposer();
      expect(sc.Mutation).toBe(sc.rootMutation());
      expect(sc.Mutation.getTypeName()).toBe('Mutation');
    });

    it('Subscription', () => {
      const sc = new SchemaComposer();
      expect(sc.Subscription).toBe(sc.rootSubscription());
      expect(sc.Subscription.getTypeName()).toBe('Subscription');
    });
  });

  describe('SchemaMustHaveType', () => {
    const sc = new SchemaComposer();
    const tc = sc.TypeComposer.create(`type Me { name: String }`);

    sc.addSchemaMustHaveType(tc);
    expect(sc._schemaMustHaveTypes).toContain(tc);

    sc.clear();
    expect(sc._schemaMustHaveTypes).not.toContain(tc);

    sc.addSchemaMustHaveType(tc);
    sc.Query.addFields({ time: 'String' });
    const schema = sc.buildSchema();
    expect(schema._typeMap.Me).toEqual(tc.getType());
  });

  describe('getTC', () => {
    it('should return TypeComposer', () => {
      const sc = new SchemaComposer();
      sc.TypeComposer.create(`
          type Author {
            name: String
          }
        `);
      expect(sc.getTC('Author')).toBeInstanceOf(TypeComposer);
    });

    it('should return GraphQLObjectType as TypeComposer', () => {
      const sc = new SchemaComposer();
      sc.add(
        new GraphQLObjectType({
          name: 'Author',
          fields: { name: { type: GraphQLString } },
        })
      );
      expect(sc.getTC('Author')).toBeInstanceOf(TypeComposer);
    });

    it('should throw error for incorrect type', () => {
      const sc = new SchemaComposer();
      sc.InputTypeComposer.create(`
        input Author {
          name: String
        }
      `);
      expect(() => sc.getTC('Author')).toThrowError('Cannot find TypeComposer with name Author');
    });
  });

  describe('getITC', () => {
    it('should return InputTypeComposer', () => {
      const sc = new SchemaComposer();
      sc.InputTypeComposer.create(`
          input Author {
            name: String
          }
        `);
      expect(sc.getITC('Author')).toBeInstanceOf(InputTypeComposer);
    });

    it('should return GraphQLInputObjectType as InputTypeComposer', () => {
      const sc = new SchemaComposer();
      sc.add(
        new GraphQLInputObjectType({
          name: 'Author',
          fields: { name: { type: GraphQLString } },
        })
      );
      expect(sc.getITC('Author')).toBeInstanceOf(InputTypeComposer);
    });

    it('should throw error for incorrect type', () => {
      const sc = new SchemaComposer();
      sc.TypeComposer.create(`
        type Author {
          name: String
        }
      `);
      expect(() => sc.getITC('Author')).toThrowError(
        'Cannot find InputTypeComposer with name Author'
      );
    });
  });

  describe('getETC', () => {
    it('should return EnumTypeComposer', () => {
      const sc = new SchemaComposer();
      sc.EnumTypeComposer.create(`
          enum Sort {
            ASC DESC
          }
        `);
      expect(sc.getETC('Sort')).toBeInstanceOf(EnumTypeComposer);
    });

    it('should return GraphQLEnumType as EnumTypeComposer', () => {
      const sc = new SchemaComposer();
      sc.add(
        new GraphQLEnumType({
          name: 'Sort',
          values: { ASC: { value: 'ASC' } },
        })
      );
      expect(sc.getETC('Sort')).toBeInstanceOf(EnumTypeComposer);
    });

    it('should throw error for incorrect type', () => {
      const sc = new SchemaComposer();
      sc.TypeComposer.create(`
        type Sort {
          name: String
        }
      `);
      expect(() => sc.getETC('Sort')).toThrowError('Cannot find EnumTypeComposer with name Sort');
    });
  });

  describe('getIFTC', () => {
    it('should return InterfaceTypeComposer', () => {
      const sc = new SchemaComposer();
      sc.InterfaceTypeComposer.create(`
          interface IFace {
            name: String
          }
        `);
      expect(sc.getIFTC('IFace')).toBeInstanceOf(InterfaceTypeComposer);
    });

    it('should return GraphQLInterfaceType as InterfaceTypeComposer', () => {
      const sc = new SchemaComposer();
      sc.add(
        new GraphQLInterfaceType({
          name: 'IFace',
          fields: { name: { type: GraphQLString } },
        })
      );
      expect(sc.getIFTC('IFace')).toBeInstanceOf(InterfaceTypeComposer);
    });

    it('should throw error for incorrect type', () => {
      const sc = new SchemaComposer();
      sc.TypeComposer.create(`
        type IFace {
          name: String
        }
      `);
      expect(() => sc.getIFTC('IFace')).toThrowError(
        'Cannot find InterfaceTypeComposer with name IFace'
      );
    });
  });

  describe('addTypeDefs', () => {
    it('should parse types from SDL', () => {
      const sc = new SchemaComposer();
      sc.addTypeDefs(`
        type Author {
          name: String
          some(arg: Int): String
        }
        input AuthorInput {
          name: String
        }
        enum Sort {
          ASC 
          DESC
        }
        interface PersonI {
          name: String
        }
      `);

      expect(sc.get('Author')).toBeInstanceOf(GraphQLObjectType);
      expect(sc.get('AuthorInput')).toBeInstanceOf(GraphQLInputObjectType);
      expect(sc.get('Sort')).toBeInstanceOf(GraphQLEnumType);
      expect(sc.get('PersonI')).toBeInstanceOf(GraphQLInterfaceType);
    });

    it('should replace existed types', () => {
      // This behavior maybe changed in future.
      // Need to gather more use cases and problems.
      const sc = new SchemaComposer();
      sc.addTypeDefs(`
        type Author {
          name: String
          some(arg: Int): String
        }
      `);
      expect(sc.getTC('Author').hasFieldArg('some', 'arg')).toBeTruthy();

      sc.addTypeDefs(`
        type Author {
          name: String
        }
      `);
      expect(sc.getTC('Author').hasFieldArg('some', 'arg')).toBeFalsy();
    });
  });

  describe('addResolveMethods', () => {
    it('should add resolve methods to fields in graphql-tools way', async () => {
      const sc = new SchemaComposer();
      sc.addTypeDefs(`
        type Post {
          id: Int!
          title: String
          votes: Int
        }

        type Query {
          posts: [Post]
        }
      `);

      sc.addResolveMethods({
        Query: {
          posts: () => [{ id: 1, title: 'Post title' }],
        },
        Post: {
          votes: () => 10,
        },
      });

      const schema = sc.buildSchema();

      expect(await graphql(schema, '{ posts { id title votes } }')).toEqual({
        data: { posts: [{ id: 1, title: 'Post title', votes: 10 }] },
      });
    });
  });
});

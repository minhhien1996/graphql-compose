"use strict";

var _graphql = require("graphql");

var _ = require("../..");

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const remoteSchema = new _graphql.GraphQLSchema({
  query: new _graphql.GraphQLObjectType({
    name: 'Query',
    fields: {
      users: {
        type: new _graphql.GraphQLList(new _graphql.GraphQLObjectType({
          name: 'User',
          fields: {
            name: {
              type: _graphql.GraphQLString
            },
            age: {
              type: _graphql.GraphQLInt
            },
            access: {
              type: new _graphql.GraphQLObjectType({
                name: 'Access',
                fields: {
                  msg: {
                    type: _graphql.GraphQLString
                  }
                }
              }),
              resolve: source => ({
                msg: source.age >= 20 ? `allowed` : 'disallowed'
              })
            }
          }
        })),
        resolve: () => [{
          name: 'u1',
          age: 10
        }, {
          name: 'u2',
          age: 20
        }, {
          name: 'u3',
          age: 30
        }]
      }
    }
  })
});
beforeEach(() => {
  _.schemaComposer.clear();
});
describe('github issue #107 merge Schema types on GQL', () => {
  it('get QueryTC from remote schema', () => {
    const RemoteQueryType = remoteSchema._queryType;

    const RemoteQueryTC = _.TypeComposer.create(RemoteQueryType);

    expect(RemoteQueryTC).toBeInstanceOf(_.TypeComposer);
    expect(RemoteQueryTC.getTypeName()).toBe('Query');
    expect(RemoteQueryTC.getFieldNames()).toEqual(['users']); // remoteMutationTC = TypeComposer.create(remoteSchema._mutationType);
    // remoteSubscriptionTC = TypeComposer.create(remoteSchema._subscriptionType);
  });
  it('get nested TC from remote schema', () => {
    const RemoteQueryType = remoteSchema._queryType;

    const RemoteQueryTC = _.TypeComposer.create(RemoteQueryType);

    const RemoteUserTC = RemoteQueryTC.get('users');
    expect(RemoteUserTC.getTypeName()).toEqual('User');
    const RemoteAccessTC = RemoteQueryTC.get('users.access');
    expect(RemoteAccessTC.getTypeName()).toEqual('Access');
  });
  it('schema stiching on Query',
  /*#__PURE__*/
  _asyncToGenerator(function* () {
    const RemoteQueryType = remoteSchema._queryType;

    const RemoteQueryTC = _.TypeComposer.create(RemoteQueryType);

    _.schemaComposer.Query.addFields(_objectSpread({
      tag: {
        type: _.TypeComposer.create(`type Tag { id: Int, title: String}`),
        resolve: () => ({
          id: 1,
          title: 'Some tag'
        })
      }
    }, RemoteQueryTC.getFields()));

    expect(_.schemaComposer.Query.getFieldNames()).toEqual(['tag', 'users']);

    const schema = _.schemaComposer.buildSchema();

    expect((yield (0, _graphql.graphql)(schema, `
          query {
            tag {
              id
              title
            }
            users {
              age
            }
          }
        `))).toEqual({
      data: {
        tag: {
          id: 1,
          title: 'Some tag'
        },
        users: [{
          age: 10
        }, {
          age: 20
        }, {
          age: 30
        }]
      }
    });
  }));
  it('schema stiching on Query.remote',
  /*#__PURE__*/
  _asyncToGenerator(function* () {
    const RemoteQueryType = remoteSchema._queryType;

    const RemoteQueryTC = _.TypeComposer.create(RemoteQueryType);

    _.schemaComposer.Query.addFields({
      tag: {
        type: _.TypeComposer.create(`type Tag { id: Int, title: String}`),
        resolve: () => ({
          id: 1,
          title: 'Some tag'
        })
      },
      remote: {
        type: _.TypeComposer.create({
          name: 'RemoteSchema',
          fields: RemoteQueryTC.getFields()
        }),
        resolve: () => ({}) // it's important to return something (not null/undefined)

      }
    });

    expect(_.schemaComposer.Query.getFieldNames()).toEqual(['tag', 'remote']);

    const schema = _.schemaComposer.buildSchema();

    expect((yield (0, _graphql.graphql)(schema, `
          query {
            tag {
              id
              title
            }
            remote {
              users {
                age
              }
            }
          }
        `))).toEqual({
      data: {
        tag: {
          id: 1,
          title: 'Some tag'
        },
        remote: {
          users: [{
            age: 10
          }, {
            age: 20
          }, {
            age: 30
          }]
        }
      }
    });
  }));
  it('using remote type in local schema',
  /*#__PURE__*/
  _asyncToGenerator(function* () {
    const RemoteQueryType = remoteSchema._queryType;

    const RemoteQueryTC = _.TypeComposer.create(RemoteQueryType);

    const RemoteUserTC = RemoteQueryTC.getFieldTC('users');
    const remoteUsersFC = RemoteQueryTC.getFieldConfig('users');

    const LocalArticleTC = _.TypeComposer.create({
      name: 'Article',
      fields: {
        text: {
          type: 'String'
        },
        author: {
          type: RemoteUserTC,
          args: _objectSpread({}, remoteUsersFC.args),
          resolve: (source, args, context, info) => {
            if (!remoteUsersFC.resolve) return null;
            const users = remoteUsersFC.resolve(source, args, context, info); // for simplicity return first user

            return users[0];
          }
        }
      }
    });

    _.schemaComposer.Query.addFields({
      article: {
        type: LocalArticleTC,
        resolve: () => ({
          text: 'Article 1'
        })
      }
    });

    const schema = _.schemaComposer.buildSchema();

    expect((yield (0, _graphql.graphql)(schema, `
          query {
            article {
              text
              author {
                name
                age
                access {
                  msg
                }
              }
            }
          }
        `))).toEqual({
      data: {
        article: {
          text: 'Article 1',
          author: {
            access: {
              msg: 'disallowed'
            },
            age: 10,
            name: 'u1'
          }
        }
      }
    });
  }));
  it('adding remote type to SchemaComposer and check reference by name', () => {
    const RemoteQueryType = remoteSchema._queryType;

    const RemoteQueryTC = _.TypeComposer.create(RemoteQueryType);

    const UserTC = RemoteQueryTC.getFieldTC('users');

    _.schemaComposer.add(UserTC);

    const ArticleTC = _.TypeComposer.create({
      name: 'Article',
      fields: {
        user: 'User',
        users: ['User']
      }
    });

    const userType = ArticleTC.getFieldType('user');
    expect(userType).toBeInstanceOf(_graphql.GraphQLObjectType);
    expect(userType.name).toBe('User');
    const usersType = ArticleTC.getFieldType('users');
    expect(usersType).toBeInstanceOf(_graphql.GraphQLList);
    expect(usersType.ofType.name).toBe('User');
  });
});
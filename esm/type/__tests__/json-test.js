function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/*  strict */
// copied from https://github.com/taion/graphql-type-json
import { graphql, GraphQLObjectType, GraphQLSchema } from '../../graphql';
import GraphQLJSON from '../json';
const FIXTURE = {
  string: 'string',
  int: 3,
  float: Math.PI,
  true: true,
  false: true,
  null: null,
  object: {
    string: 'string',
    int: 3,
    float: Math.PI,
    true: true,
    false: true,
    null: null
  },
  array: ['string', 3, Math.PI, true, false, null]
};
describe('GraphQLJSON', () => {
  let schema;
  beforeEach(() => {
    schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          value: {
            type: GraphQLJSON,
            args: {
              arg: {
                type: GraphQLJSON
              }
            },
            resolve: (obj, {
              arg
            }) => arg
          }
        }
      })
    });
  });
  describe('serialize', () => {
    it('should support serialization', () => {
      expect(GraphQLJSON.serialize(FIXTURE)).toEqual(FIXTURE);
    });
  });
  describe('parseValue', () => {
    it('should support parsing values', done => {
      graphql(schema, 'query ($arg: JSON) { value(arg: $arg) }', null, null, {
        arg: FIXTURE
      }).then(({
        data
      }) => {
        expect(data.value).toEqual(FIXTURE);
        done();
      });
    });
  });
  describe('parseLiteral', () => {
    it('should support parsing literals', done => {
      graphql(schema, `
          {
            value(
              arg: {
                string: "string"
                int: 3
                float: 3.14
                true: true
                false: false
                null: null
                object: {
                  string: "string"
                  int: 3
                  float: 3.14
                  true: true
                  false: false
                  null: null
                }
                array: ["string", 3, 3.14, true, false, null]
              }
            )
          }
        `).then(({
        data
      }) => {
        expect(data.value).toEqual({
          string: 'string',
          int: 3,
          float: 3.14,
          true: true,
          false: false,
          null: null,
          object: {
            string: 'string',
            int: 3,
            float: 3.14,
            true: true,
            false: false,
            null: null
          },
          array: ['string', 3, 3.14, true, false, null]
        });
        done();
      });
    });
    it('should reject invalid literals',
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      const _ref2 = yield graphql(schema, `
        {
          value(arg: NaN){
            string: "string"
        }
       `),
            data = _ref2.data;

      expect(data).toBeUndefined();
    }));
  });
});
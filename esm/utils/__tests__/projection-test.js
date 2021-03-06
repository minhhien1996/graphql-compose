function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/*  strict */
import { graphql } from '../../graphql';
import { getProjectionFromAST, extendByFieldProjection } from '../projection';
import { TypeComposer, schemaComposer } from '../..';
const Level2TC = TypeComposer.create({
  name: 'Level2',
  fields: {
    field2a: 'String',
    field2b: 'Int',
    withProjection2: {
      type: 'Int',
      projection: {
        field2b: true
      }
    }
  }
});
const Level1TC = TypeComposer.create({
  name: 'Level1',
  fields: {
    field1a: [Level2TC],
    field1b: 'Int',
    withProjection1: {
      type: 'Int',
      projection: {
        field1b: true,
        field1a: {
          field2a: true
        }
      }
    }
  }
});
const resolve = jest.fn(() => ({}));
schemaComposer.rootQuery().addFields({
  field0: {
    type: Level1TC,
    resolve
  }
});
const schema = schemaComposer.buildSchema();

const getResolveInfo =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (query) {
    resolve.mockClear();
    const res = yield graphql(schema, query);

    if (res && res.errors) {
      throw new Error(res.errors[0]);
    }

    return resolve.mock.calls[0][3];
  });

  return function getResolveInfo(_x) {
    return _ref.apply(this, arguments);
  };
}();

describe('projection', () => {
  describe('getProjectionFromAST()', () => {
    it('simple query',
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      const info = yield getResolveInfo(`
        query {
          field0 {
            field1a { field2a }
            field1b
          }
        }
      `);
      expect(getProjectionFromAST(info)).toEqual({
        field1a: {
          field2a: {}
        },
        field1b: {}
      });
    }));
    it('inline fragments',
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      const info = yield getResolveInfo(`
        query {
          field0 {
            field1a { field2a }
            ... {
              field1a { field2b }
              field1b
            }
          }
        }
      `);
      expect(getProjectionFromAST(info)).toEqual({
        field1a: {
          field2a: {},
          field2b: {}
        },
        field1b: {}
      });
    }));
    it('fragment spreads',
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      const info = yield getResolveInfo(`
        query {
          field0 {
            ...Frag
            field1b
          }
        }

        fragment Frag on Level1 {
          field1a {
            field2b
          }
        }
      `);
      expect(getProjectionFromAST(info)).toEqual({
        field1a: {
          field2b: {}
        },
        field1b: {}
      });
    }));
    it('fragment spreads with deep merge',
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      const info = yield getResolveInfo(`
        query {
          field0 {
            ...Frag
            field1a {
              field2a
            }
          }
        }

        fragment Frag on Level1 {
          field1a {
            field2b
          }
        }
      `);
      expect(getProjectionFromAST(info)).toEqual({
        field1a: {
          field2a: {},
          field2b: {}
        }
      });
    }));
    it('extend by field.projection',
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      const info = yield getResolveInfo(`
        query {
          field0 {
            withProjection1
          }
        }
      `);
      expect(getProjectionFromAST(info)).toEqual({
        withProjection1: {},
        field1b: true,
        field1a: {
          field2a: true
        }
      });
    }));
    it('extend by field.projection deep',
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      const info = yield getResolveInfo(`
        query {
          field0 {
            field1a {
              withProjection2
            }
          }
        }
      `); // console.dir(info, { colors: true, depth: 3 });

      expect(getProjectionFromAST(info)).toEqual({
        field1a: {
          withProjection2: {},
          field2b: true
        }
      });
    }));
  });
  describe('extendByFieldProjection()', () => {
    it('first level', () => {
      const type = schema.getType('Level1');
      const projection = {
        withProjection1: true
      };
      expect(extendByFieldProjection(type, projection)).toEqual({
        field1a: {
          field2a: true
        },
        field1b: true,
        withProjection1: true
      });
    });
    it('second level', () => {
      const type = schema.getType('Level1');
      const projection = {
        field1a: {
          withProjection2: {}
        }
      };
      expect(extendByFieldProjection(type, projection)).toEqual({
        field1a: {
          field2b: true,
          withProjection2: {}
        }
      });
    });
  });
});
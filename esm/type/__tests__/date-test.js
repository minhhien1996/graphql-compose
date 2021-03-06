function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/*  strict */
// copied from https://github.com/taion/graphql-type-json
import { Kind } from '../../graphql';
import GraphQLDate from '../date';
describe('GraphQLDate', () => {
  describe('serialize', () => {
    it('pass Date object', () => {
      expect(GraphQLDate.serialize(new Date(Date.UTC(2017, 10, 19)))).toBe('2017-11-19T00:00:00.000Z');
    });
    it('pass number', () => {
      expect(GraphQLDate.serialize(new Date(Date.UTC(2018, 10, 1)).getTime())).toBe('2018-11-01T00:00:00.000Z');
    });
    it('pass "2016-02-02T00:13:22.000Z"', () => {
      expect(GraphQLDate.serialize('2016-02-02T00:13:22.000Z')).toBe('2016-02-02T00:13:22.000Z');
    });
    it('pass "2016-02-02T00:13:22Z"', () => {
      expect(GraphQLDate.serialize('2016-02-02T00:13:22Z')).toBe('2016-02-02T00:13:22Z');
    });
    it('pass "2016-02-02"', () => {
      expect(GraphQLDate.serialize('2016-02-02')).toBe('2016-02-02');
    });
  });
  describe('parseValue', () => {
    it('support parsing values', () => {
      expect(GraphQLDate.parseValue('2017-11-18T00:00:00.000Z')).toEqual(new Date(Date.UTC(2017, 10, 18, 0, 0, 0)));
    });
  });
  describe('parseLiteral', () => {
    it('parse a ast literal',
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      const ast = {
        kind: Kind.STRING,
        value: '2015-07-24T10:56:42.744Z'
      };
      const date = GraphQLDate.parseLiteral(ast);
      expect(date).toBeInstanceOf(Date);
      expect(date.toJSON()).toEqual(ast.value);
    }));
  });
  it('parse a ast literal of integer kind',
  /*#__PURE__*/
  _asyncToGenerator(function* () {
    const ast = {
      kind: Kind.INT,
      value: '1541030400000'
    };
    const date = GraphQLDate.parseLiteral(ast);
    expect(date).toBeInstanceOf(Date);
    expect(date.toJSON()).toBe('2018-11-01T00:00:00.000Z');
  }));
});
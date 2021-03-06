"use strict";

var _toDottedObject = _interopRequireDefault(require("../toDottedObject"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*  strict */
describe('toDottedObject()', () => {
  it('should dot nested objects', () => {
    expect((0, _toDottedObject.default)({
      a: {
        b: {
          c: 1
        }
      }
    })).toEqual({
      'a.b.c': 1
    });
  });
  it('should work with arrays', () => {
    expect((0, _toDottedObject.default)({
      a: {
        b: [{
          c: 1
        }, {
          d: 1
        }]
      }
    })).toEqual({
      'a.b.0.c': 1,
      'a.b.1.d': 1
    });
  });
});
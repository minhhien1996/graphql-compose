"use strict";

var _ = require("..");

/*  strict */
describe('Flowtype tests', () => {
  it('TContext validation tests', () => {
    const Schema = new _.SchemaComposer();
    const UserTC = Schema.TypeComposer.create('User');
    UserTC.addResolver({
      name: 'findOne',
      resolve: ({
        context
      }) => {
        context.a; // $FlowFixMe property `c2` not found in Context

        context.c2;
      }
    }); //
    //

    const Schema2 = new _.SchemaComposer();
    const UserTC2 = Schema2.TypeComposer.create('User');
    UserTC2.addResolver({
      name: 'findOne',
      resolve: ({
        context
      }) => {
        // $FlowFixMe property `a` not found in Context2
        context.a;
        context.c2;
      }
    });
  });
});
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Resolver = void 0;

var _objectPath = _interopRequireDefault(require("object-path"));

var _util = _interopRequireDefault(require("util"));

var _graphql = require("./graphql");

var _deepmerge = _interopRequireDefault(require("./utils/deepmerge"));

var _configAsThunk = require("./utils/configAsThunk");

var _misc = require("./utils/misc");

var _is = require("./utils/is");

var _filterByDotPaths = _interopRequireDefault(require("./utils/filterByDotPaths"));

var _projection = require("./utils/projection");

var _typeByPath = require("./utils/typeByPath");

var _json = _interopRequireDefault(require("./type/json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Resolver {
  get schemaComposer() {
    return this.constructor.schemaComposer;
  }

  constructor(opts) {
    if (!this.schemaComposer) {
      throw new Error('Class<Resolver> can only be created by a SchemaComposer.');
    }

    if (!opts.name) {
      throw new Error('For Resolver constructor the `opts.name` is required option.');
    }

    this.name = opts.name;
    this.displayName = opts.displayName || null;
    this.parent = opts.parent || null;
    this.kind = opts.kind || null;
    this.description = opts.description || '';

    if (opts.type) {
      this.setType(opts.type);
    }

    this.args = opts.args || {};

    if (opts.resolve) {
      this.resolve = opts.resolve;
    } // Alive proper Flow type casting in autosuggestions for class with Generics
    // it's required due using <TSource, TContext>
    // and Class<> utility type in SchemaComposer

    /* :: return this; */

  } // -----------------------------------------------
  // Output type methods
  // -----------------------------------------------


  getType() {
    if (!this.type) {
      return _json.default;
    }

    const fc = (0, _configAsThunk.resolveOutputConfigAsThunk)(this.schemaComposer, this.type, this.name, 'Resolver');
    return fc.type;
  }

  getTypeComposer() {
    const outputType = (0, _graphql.getNamedType)(this.getType());

    if (!(outputType instanceof _graphql.GraphQLObjectType)) {
      throw new Error(`Resolver ${this.name} cannot return its output type as TypeComposer instance. ` + `Cause '${this.type.toString()}' does not instance of GraphQLObjectType.`);
    }

    return new this.schemaComposer.TypeComposer(outputType);
  }

  setType(composeType) {
    // check that `composeType` has correct data
    this.schemaComposer.typeMapper.convertOutputFieldConfig(composeType, 'setType', 'Resolver');
    this.type = composeType;
    return this;
  } // -----------------------------------------------
  // Args methods
  // -----------------------------------------------


  hasArg(argName) {
    return !!this.args[argName];
  }

  getArg(argName) {
    if (!this.hasArg(argName)) {
      throw new Error(`Cannot get arg '${argName}' for resolver ${this.name}. Argument does not exist.`);
    }

    return this.args[argName];
  }

  getArgConfig(argName) {
    const arg = this.getArg(argName);
    return (0, _configAsThunk.resolveArgConfigAsThunk)(this.schemaComposer, arg, argName, this.name, 'Resolver');
  }

  getArgType(argName) {
    const ac = this.getArgConfig(argName);
    return ac.type;
  }

  getArgTC(argName) {
    const argType = (0, _graphql.getNamedType)(this.getArgType(argName));

    if (!(argType instanceof _graphql.GraphQLInputObjectType)) {
      throw new Error(`Cannot get InputTypeComposer for arg '${argName}' in resolver ${this.getNestedName()}. ` + `This argument should be InputObjectType, but it has type '${argType.constructor.name}'`);
    }

    return new this.schemaComposer.InputTypeComposer(argType);
  }

  getArgs() {
    return this.args;
  }

  getArgNames() {
    return Object.keys(this.args);
  }

  setArgs(args) {
    this.args = args;
    return this;
  }

  setArg(argName, argConfig) {
    this.args[argName] = argConfig;
    return this;
  }

  extendArg(argName, partialArgConfig) {
    let prevArgConfig;

    try {
      prevArgConfig = this.getArgConfig(argName);
    } catch (e) {
      throw new Error(`Cannot extend arg '${argName}' in Resolver '${this.name}'. Argument does not exist.`);
    }

    this.setArg(argName, _objectSpread({}, prevArgConfig, partialArgConfig));
    return this;
  }

  addArgs(newArgs) {
    this.setArgs(_objectSpread({}, this.getArgs(), newArgs));
    return this;
  }

  removeArg(argNameOrArray) {
    const argNames = Array.isArray(argNameOrArray) ? argNameOrArray : [argNameOrArray];
    argNames.forEach(argName => {
      delete this.args[argName];
    });
    return this;
  }

  removeOtherArgs(argNameOrArray) {
    const keepArgNames = Array.isArray(argNameOrArray) ? argNameOrArray : [argNameOrArray];
    Object.keys(this.args).forEach(argName => {
      if (keepArgNames.indexOf(argName) === -1) {
        delete this.args[argName];
      }
    });
    return this;
  }

  reorderArgs(names) {
    const orderedArgs = {};
    names.forEach(name => {
      if (this.args[name]) {
        orderedArgs[name] = this.args[name];
        delete this.args[name];
      }
    });
    this.args = _objectSpread({}, orderedArgs, this.args);
    return this;
  }

  cloneArg(argName, newTypeName) {
    if (!{}.hasOwnProperty.call(this.args, argName)) {
      throw new Error(`Can not clone arg ${argName} for resolver ${this.name}. Argument does not exist.`);
    }

    let originalType = this.getArgType(argName);
    let isUnwrapped = false;

    if (originalType instanceof _graphql.GraphQLNonNull) {
      originalType = originalType.ofType;
      isUnwrapped = true;
    }

    if (!(originalType instanceof _graphql.GraphQLInputObjectType)) {
      throw new Error(`Can not clone arg ${argName} for resolver ${this.name}.` + 'Argument should be GraphQLInputObjectType (complex input type).');
    }

    if (!newTypeName || newTypeName !== (0, _misc.clearName)(newTypeName)) {
      throw new Error('You should provide new type name as second argument');
    }

    if (newTypeName === originalType.name) {
      throw new Error('You should provide new type name. It is equal to current name.');
    }

    let clonedType = this.schemaComposer.InputTypeComposer.createTemp(originalType).clone(newTypeName).getType();

    if (isUnwrapped) {
      clonedType = new _graphql.GraphQLNonNull(clonedType);
    }

    this.extendArg(argName, {
      type: clonedType
    });
    return this;
  }

  isRequired(argName) {
    return this.getArgType(argName) instanceof _graphql.GraphQLNonNull;
  }

  makeRequired(argNameOrArray) {
    const argNames = Array.isArray(argNameOrArray) ? argNameOrArray : [argNameOrArray];
    argNames.forEach(argName => {
      if (this.hasArg(argName)) {
        const argType = this.getArgType(argName);

        if (!(0, _graphql.isInputType)(argType)) {
          throw new Error(`Cannot make argument ${argName} required. It should be InputType: ${JSON.stringify(argType)}`);
        }

        if (!(argType instanceof _graphql.GraphQLNonNull)) {
          this.extendArg(argName, {
            type: new _graphql.GraphQLNonNull(argType)
          });
        }
      }
    });
    return this;
  }

  makeOptional(argNameOrArray) {
    const argNames = Array.isArray(argNameOrArray) ? argNameOrArray : [argNameOrArray];
    argNames.forEach(argName => {
      if (this.hasArg(argName)) {
        const argType = this.getArgType(argName);

        if (argType instanceof _graphql.GraphQLNonNull) {
          this.extendArg(argName, {
            type: argType.ofType
          });
        }
      }
    });
    return this;
  }

  addFilterArg(opts) {
    if (!opts.name) {
      throw new Error('For Resolver.addFilterArg the arg name `opts.name` is required.');
    }

    if (!opts.type) {
      throw new Error('For Resolver.addFilterArg the arg type `opts.type` is required.');
    }

    const resolver = this.wrap(null, {
      name: 'addFilterArg'
    }); // get filterTC or create new one argument

    const filter = resolver.hasArg('filter') ? resolver.getArgConfig('filter') : undefined;
    let filterITC;

    if (filter && filter.type instanceof _graphql.GraphQLInputObjectType) {
      filterITC = new this.schemaComposer.InputTypeComposer(filter.type);
    } else {
      if (!opts.filterTypeNameFallback || !(0, _is.isString)(opts.filterTypeNameFallback)) {
        throw new Error('For Resolver.addFilterArg needs to provide `opts.filterTypeNameFallback: string`. ' + 'This string will be used as unique name for `filter` type of input argument. ' + 'Eg. FilterXXXXXInput');
      }

      filterITC = this.schemaComposer.InputTypeComposer.createTemp(opts.filterTypeNameFallback);
    }

    let defaultValue;

    if (filter && filter.defaultValue) {
      defaultValue = filter.defaultValue;
    }

    if (opts.defaultValue) {
      if (!defaultValue) {
        defaultValue = {};
      }

      defaultValue[opts.name] = opts.defaultValue;
    }

    resolver.setArg('filter', {
      type: filterITC.getType(),
      description: filter && filter.description || undefined,
      defaultValue
    });
    filterITC.setField(opts.name, _objectSpread({}, (0, _misc.only)(opts, ['name', 'type', 'defaultValue', 'description'])));
    const resolveNext = resolver.getResolve();
    const query = opts.query;

    if (query && (0, _is.isFunction)(query)) {
      resolver.setResolve(
      /*#__PURE__*/
      function () {
        var _ref = _asyncToGenerator(function* (resolveParams) {
          const value = _objectPath.default.get(resolveParams, ['args', 'filter', opts.name]);

          if (value !== null && value !== undefined) {
            if (!resolveParams.rawQuery) {
              resolveParams.rawQuery = {}; // eslint-disable-line
            }

            yield query(resolveParams.rawQuery, value, resolveParams);
          }

          return resolveNext(resolveParams);
        });

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }());
    }

    return resolver;
  }

  addSortArg(opts) {
    if (!opts.name) {
      throw new Error('For Resolver.addSortArg the `opts.name` is required.');
    }

    if (!opts.value) {
      throw new Error('For Resolver.addSortArg the `opts.value` is required.');
    }

    const resolver = this.wrap(null, {
      name: 'addSortArg'
    }); // get sortETC or create new one

    let sortETC;

    if (resolver.hasArg('sort')) {
      const sortConfig = resolver.getArgConfig('sort');

      if (sortConfig.type instanceof _graphql.GraphQLEnumType) {
        sortETC = this.schemaComposer.EnumTypeComposer.createTemp(sortConfig.type);
      } else {
        throw new Error('Resolver must have `sort` arg with type GraphQLEnumType. ' + `But got: ${_util.default.inspect(sortConfig.type, {
          depth: 2
        })} `);
      }
    } else {
      if (!opts.sortTypeNameFallback || !(0, _is.isString)(opts.sortTypeNameFallback)) {
        throw new Error('For Resolver.addSortArg needs to provide `opts.sortTypeNameFallback: string`. ' + 'This string will be used as unique name for `sort` type of input argument. ' + 'Eg. SortXXXXXEnum');
      }

      sortETC = this.schemaComposer.EnumTypeComposer.createTemp({
        name: opts.sortTypeNameFallback,
        values: {
          [opts.name]: {}
        }
      });
      resolver.setArg('sort', sortETC);
    } // extend sortETC with new sorting value


    sortETC.setField(opts.name, {
      description: opts.description,
      deprecationReason: opts.deprecationReason,
      value: (0, _is.isFunction)(opts.value) ? opts.name : opts.value
    }); // If sort value is evaluable (function), then wrap resolve method

    const resolveNext = resolver.getResolve();

    if ((0, _is.isFunction)(opts.value)) {
      const getValue = opts.value;
      resolver.setResolve(resolveParams => {
        const value = _objectPath.default.get(resolveParams, ['args', 'sort']);

        if (value === opts.name) {
          const newSortValue = getValue(resolveParams);
          resolveParams.args.sort = newSortValue; // eslint-disable-line
        }

        return resolveNext(resolveParams);
      });
    }

    return resolver;
  } // -----------------------------------------------
  // Resolve methods
  // -----------------------------------------------

  /*
  * This method should be overriden via constructor
  */

  /* eslint-disable */


  resolve(resolveParams) {
    return Promise.resolve();
  }
  /* eslint-enable */


  getResolve() {
    return this.resolve;
  }

  setResolve(resolve) {
    this.resolve = resolve;
    return this;
  } // -----------------------------------------------
  // Wrap methods
  // -----------------------------------------------


  wrap(cb, newResolverOpts = {}) {
    const prevResolver = this;
    const newResolver = this.clone(_objectSpread({
      name: 'wrap',
      parent: prevResolver
    }, newResolverOpts));

    if ((0, _is.isFunction)(cb)) {
      const resolver = cb(newResolver, prevResolver);
      if (resolver) return resolver;
    }

    return newResolver;
  }

  wrapResolve(cb, wrapperName = 'wrapResolve') {
    return this.wrap((newResolver, prevResolver) => {
      const newResolve = cb(prevResolver.getResolve());
      newResolver.setResolve(newResolve);
      return newResolver;
    }, {
      name: wrapperName
    });
  }

  wrapArgs(cb, wrapperName = 'wrapArgs') {
    return this.wrap((newResolver, prevResolver) => {
      // clone prevArgs, to avoid changing args in callback
      const prevArgs = _objectSpread({}, prevResolver.getArgs());

      const newArgs = cb(prevArgs);
      newResolver.setArgs(newArgs);
      return newResolver;
    }, {
      name: wrapperName
    });
  }

  wrapCloneArg(argName, newTypeName) {
    return this.wrap(newResolver => newResolver.cloneArg(argName, newTypeName), {
      name: 'cloneFilterArg'
    });
  }

  wrapType(cb, wrapperName = 'wrapType') {
    return this.wrap((newResolver, prevResolver) => {
      const prevType = prevResolver.getType();
      const newType = cb(prevType);
      newResolver.setType(newType);
      return newResolver;
    }, {
      name: wrapperName
    });
  } // -----------------------------------------------
  // Misc methods
  // -----------------------------------------------


  getFieldConfig(opts = {}) {
    const _resolve = this.getResolve();

    return {
      type: this.getType(),
      args: (0, _configAsThunk.resolveArgConfigMapAsThunk)(this.schemaComposer, this.getArgs(), this.name, 'Resolver'),
      description: this.description,
      resolve: (source, args, context, info) => {
        let projection = (0, _projection.getProjectionFromAST)(info);

        if (opts.projection) {
          projection = (0, _deepmerge.default)(projection, opts.projection);
        }

        return _resolve({
          source,
          args,
          context,
          info,
          projection
        });
      }
    };
  }

  getKind() {
    return this.kind;
  }

  setKind(kind) {
    if (kind !== 'query' && kind !== 'mutation' && kind !== 'subscription') {
      throw new Error(`You provide incorrect value '${kind}' for Resolver.setKind method. ` + 'Valid values are: query | mutation | subscription');
    }

    this.kind = kind;
    return this;
  }

  getDescription() {
    return this.description;
  }

  setDescription(description) {
    this.description = description;
    return this;
  }

  get(path) {
    return (0, _typeByPath.typeByPath)(this, path);
  }

  clone(opts = {}) {
    const oldOpts = {};
    const self = this;

    for (const key in self) {
      if (self.hasOwnProperty(key)) {
        // $FlowFixMe
        oldOpts[key] = self[key];
      }
    }

    oldOpts.displayName = undefined;
    oldOpts.args = _objectSpread({}, this.args);
    return new this.schemaComposer.Resolver(_objectSpread({}, oldOpts, opts));
  } // -----------------------------------------------
  // Debug methods
  // -----------------------------------------------


  getNestedName() {
    const name = this.displayName || this.name;

    if (this.parent) {
      return `${name}(${this.parent.getNestedName()})`;
    }

    return name;
  }

  toString(colors = true) {
    return _util.default.inspect(this.toDebugStructure(false), {
      depth: 20,
      colors
    }).replace(/\\n/g, '\n');
  }

  setDisplayName(name) {
    this.displayName = name;
    return this;
  }

  toDebugStructure(colors = true) {
    const info = {
      name: this.name,
      displayName: this.displayName,
      type: _util.default.inspect(this.type, {
        depth: 2,
        colors
      }),
      args: this.args,
      resolve: this.resolve ? this.resolve.toString() : this.resolve
    };

    if (this.parent) {
      info.resolve = [info.resolve, {
        'Parent resolver': this.parent.toDebugStructure(colors)
      }];
    }

    return info;
  }

  debugExecTime() {
    var _this = this;

    /* eslint-disable no-console */
    return this.wrapResolve(next =>
    /*#__PURE__*/
    function () {
      var _ref2 = _asyncToGenerator(function* (rp) {
        const name = `Execution time for ${_this.getNestedName()}`;
        console.time(name);
        const res = yield next(rp);
        console.timeEnd(name);
        return res;
      });

      return function (_x2) {
        return _ref2.apply(this, arguments);
      };
    }(), 'debugExecTime');
    /* eslint-enable no-console */
  }

  debugParams(filterPaths, opts = {
    colors: true,
    depth: 5
  }) {
    /* eslint-disable no-console */
    return this.wrapResolve(next => rp => {
      console.log(`ResolveParams for ${this.getNestedName()}:`);
      const data = (0, _filterByDotPaths.default)(rp, filterPaths, {
        // is hidden (use debugParams(["info"])) or debug({ params: ["info"]})
        // `is hidden (use debugParams(["context.*"])) or debug({ params: ["context.*"]})`,
        hideFields: rp && rp.context && rp.context.res && rp.context.params && rp.context.headers ? {
          // looks like context is express request, colapse it
          info: '[[hidden]]',
          context: '[[hidden]]'
        } : {
          info: '[[hidden]]',
          'context.*': '[[hidden]]'
        },
        hideFieldsNote: 'Some data was [[hidden]] to display this fields use debugParams("%fieldNames%")'
      });
      console.dir(data, opts);
      return next(rp);
    }, 'debugParams');
    /* eslint-enable no-console */
  }

  debugPayload(filterPaths, opts = {
    colors: true,
    depth: 5
  }) {
    var _this2 = this;

    /* eslint-disable no-console */
    return this.wrapResolve(next =>
    /*#__PURE__*/
    function () {
      var _ref3 = _asyncToGenerator(function* (rp) {
        try {
          const res = yield next(rp);
          console.log(`Resolved Payload for ${_this2.getNestedName()}:`);

          if (Array.isArray(res) && res.length > 3 && !filterPaths) {
            console.dir([filterPaths ? (0, _filterByDotPaths.default)(res[0], filterPaths) : res[0], `[debug note]: Other ${res.length - 1} records was [[hidden]]. ` + 'Use debugPayload("0 1 2 3 4") or debug({ payload: "0 1 2 3 4" }) for display this records'], opts);
          } else {
            console.dir(filterPaths ? (0, _filterByDotPaths.default)(res, filterPaths) : res, opts);
          }

          return res;
        } catch (e) {
          console.log(`Rejected Payload for ${_this2.getNestedName()}:`);
          console.log(e);
          throw e;
        }
      });

      return function (_x3) {
        return _ref3.apply(this, arguments);
      };
    }(), 'debugPayload');
    /* eslint-enable no-console */
  }

  debug(filterDotPaths, opts = {
    colors: true,
    depth: 2
  }) {
    return this.debugExecTime().debugParams(filterDotPaths ? filterDotPaths.params : null, opts).debugPayload(filterDotPaths ? filterDotPaths.payload : null, opts);
  }

}

exports.Resolver = Resolver;
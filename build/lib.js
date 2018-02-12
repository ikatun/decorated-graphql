'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toExcecutableMergedSchema = exports.getMergedResolvers = exports.toMergedSchemasString = exports.Enum = exports.input = exports.type = exports.query = exports.mutation = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphqlTools = require('graphql-tools');

var _mergeGraphqlSchemas = require('merge-graphql-schemas');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var mutation = exports.mutation = function mutation(templateStrings) {
  return function (_ref, methodName) {
    var decoratedClass = _ref.constructor;

    var existingMutations = _lodash2.default.get(decoratedClass, 'graphql.mutations', []);

    decoratedClass.graphql = _extends({}, decoratedClass.graphql, {
      mutations: [].concat(_toConsumableArray(existingMutations), [{
        name: methodName,
        args: templateStrings.join('')
      }])
    });
  };
};

var query = exports.query = function query(templateStrings) {
  return function (_ref2, methodName) {
    var decoratedClass = _ref2.constructor;

    var existingQueries = _lodash2.default.get(decoratedClass, 'graphql.queries', []);

    decoratedClass.graphql = _extends({}, decoratedClass.graphql, {
      queries: [].concat(_toConsumableArray(existingQueries), [{
        name: methodName,
        args: templateStrings.join('')
      }])
    });
  };
};

var extractType = function extractType(decoratedClass) {
  var className = decoratedClass.name;

  var type = _lodash2.default.get(decoratedClass, 'graphql.type');
  if (!type) {
    return '';
  }

  return `type ${className} { ${type}\n}\n`;
};

var extractInput = function extractInput(decoratedClass) {
  var className = decoratedClass.name;

  var input = _lodash2.default.get(decoratedClass, 'graphql.input');
  if (!input) {
    return '';
  }

  return `input ${className} { ${input}\n}\n`;
};

var extractEnums = function extractEnums(decoratedClass) {
  var className = decoratedClass.name;

  var Enum = _lodash2.default.get(decoratedClass, 'graphql.enum');
  if (!Enum) {
    return '';
  }

  return `enum ${className} { ${Enum}\n}\n`;
};

var extractQueries = function extractQueries(decoratedClass) {
  var queries = _lodash2.default.get(decoratedClass, 'graphql.queries');
  if (_lodash2.default.isEmpty(queries)) {
    return '';
  }

  var body = queries.map(function (_ref3) {
    var name = _ref3.name,
        args = _ref3.args;
    return `  ${name} ${args}`;
  }).join('\n');
  return `type Query {\n${body}\n}\n`;
};

var extractMutations = function extractMutations(decoratedClass) {
  var mutations = _lodash2.default.get(decoratedClass, 'graphql.mutations');
  if (_lodash2.default.isEmpty(mutations)) {
    return '';
  }

  var body = mutations.map(function (_ref4) {
    var name = _ref4.name,
        args = _ref4.args;
    return `  ${name} ${args}`;
  }).join('\n');
  return `type Mutation {\n${body}\n}\n`;
};

var toSchemaString = function toSchemaString(decoratedClass) {
  return _lodash2.default.filter([extractInput, extractType, extractQueries, extractMutations, extractEnums].map(function (x) {
    return x(decoratedClass);
  })).join('\n');
};

var getOwnPropertyNames = Object.getOwnPropertyNames,
    getPrototypeOf = Object.getPrototypeOf;


var ignoredMethods = ['constructor', 'getResolvers', 'toSchemaString', 'toExcecutableSchema'];

var getClassMethods = function getClassMethods(classObject) {
  return _lodash2.default.difference(getOwnPropertyNames(classObject.prototype), ignoredMethods);
};
var getQueryMethods = function getQueryMethods(classObject) {
  return _lodash2.default.map(_lodash2.default.get(classObject, 'graphql.queries'), 'name');
};
var getMutationMethods = function getMutationMethods(classObject) {
  return _lodash2.default.map(_lodash2.default.get(classObject, 'graphql.mutations'), 'name');
};

var getSubqueryMethods = function getSubqueryMethods(classObject) {
  return _lodash2.default.difference(getClassMethods(classObject), getQueryMethods(classObject), getMutationMethods(classObject));
};

var convertToObject = function convertToObject(classInstance) {
  var propertyNames = getOwnPropertyNames(getPrototypeOf(classInstance)).filter(function (x) {
    return x !== 'constructor';
  });
  var properties = propertyNames.map(function (name) {
    return classInstance[name];
  });

  return _lodash2.default.zipObject(propertyNames, properties);
};

var toResolvers = function toResolvers(classInstance) {
  var objectInstance = convertToObject(classInstance);
  var classObject = classInstance.constructor;

  var _map$map$map = [getQueryMethods, getMutationMethods, getSubqueryMethods].map(function (selectMethods) {
    return selectMethods(classObject);
  }).map(function (methods) {
    return _lodash2.default.pick(objectInstance, methods);
  }).map(function (x) {
    return _lodash2.default.isEmpty(x) ? undefined : x;
  }),
      _map$map$map2 = _slicedToArray(_map$map$map, 3),
      Query = _map$map$map2[0],
      Mutation = _map$map$map2[1],
      TypeResolvers = _map$map$map2[2];

  return _lodash2.default.pickBy({
    Query,
    Mutation,
    [classObject.name]: TypeResolvers
  }, _lodash2.default.size);
};

var toExcecutableSchema = function toExcecutableSchema(classInstance) {
  return (0, _graphqlTools.makeExecutableSchema)({
    typeDefs: toSchemaString(classInstance.constructor),
    resolvers: toResolvers(classInstance)
  });
};

var type = exports.type = function type(templateStrings) {
  return function (decoratedClass) {
    decoratedClass.graphql = _extends({}, decoratedClass.graphql, {
      type: templateStrings.join('')
    });

    Object.assign(decoratedClass.prototype, {
      toExcecutableSchema() {
        return toExcecutableSchema(this);
      },
      toSchemaString() {
        return toSchemaString(decoratedClass);
      },
      getResolvers() {
        return toResolvers(this);
      }
    });
  };
};

var input = exports.input = function input(templateStrings) {
  return function (decoratedClass) {
    decoratedClass.graphql = _extends({}, decoratedClass.graphql, {
      input: templateStrings.join('')
    });

    Object.assign(decoratedClass.prototype, {
      toExcecutableSchema() {
        return toExcecutableSchema(this);
      },
      toSchemaString() {
        return toSchemaString(decoratedClass);
      },
      getResolvers() {
        return toResolvers(this);
      }
    });
  };
};

var Enum = exports.Enum = function Enum(templateStrings) {
  return function (decoratedClass) {
    decoratedClass.graphql = _extends({}, decoratedClass.graphql, {
      enum: templateStrings.join('')
    });

    Object.assign(decoratedClass.prototype, {
      toExcecutableSchema() {
        return toExcecutableSchema(this);
      },
      toSchemaString() {
        return toSchemaString(decoratedClass);
      },
      getResolvers() {
        return toResolvers(this);
      }
    });
  };
};

var toMergedSchemasString = exports.toMergedSchemasString = function toMergedSchemasString(classesObjects) {
  return (0, _mergeGraphqlSchemas.mergeTypes)(_lodash2.default.map(classesObjects, toSchemaString));
};

var getMergedResolvers = exports.getMergedResolvers = function getMergedResolvers(classesObjects) {
  return (0, _mergeGraphqlSchemas.mergeResolvers)(_lodash2.default.map(classesObjects, function (X) {
    return new X();
  }).map(toResolvers));
};

var toExcecutableMergedSchema = exports.toExcecutableMergedSchema = function toExcecutableMergedSchema(classesObjects) {
  return (0, _graphqlTools.makeExecutableSchema)({
    typeDefs: toMergedSchemasString(classesObjects),
    resolvers: getMergedResolvers(classesObjects)
  });
};
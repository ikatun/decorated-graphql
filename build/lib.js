'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toExcecutableMergedSchema = exports.getMergedResolvers = exports.toMergedSchemasString = exports.Enum = exports.input = exports.type = exports.subscription = exports.query = exports.mutation = exports.publish = undefined;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _getOwnPropertyNames = require('babel-runtime/core-js/object/get-own-property-names');

var _getOwnPropertyNames2 = _interopRequireDefault(_getOwnPropertyNames);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

exports.generateSchemaJson = generateSchemaJson;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphqlTools = require('graphql-tools');

var _mergeGraphqlSchemas = require('merge-graphql-schemas');

var _graphql = require('graphql');

var _utilities = require('graphql/utilities');

var _graphqlSubscriptions = require('graphql-subscriptions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pubsub = new _graphqlSubscriptions.PubSub();
var publish = exports.publish = function publish(subscriptionName, msg) {
  return pubsub.publish(subscriptionName, { [subscriptionName]: msg });
};

var mutation = exports.mutation = function mutation(templateStrings) {
  return function (_ref, methodName) {
    var decoratedClass = _ref.constructor;

    var existingMutations = _lodash2.default.get(decoratedClass, 'graphql.mutations', []);

    decoratedClass.graphql = (0, _extends3.default)({}, decoratedClass.graphql, {
      mutations: [].concat((0, _toConsumableArray3.default)(existingMutations), [{
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

    decoratedClass.graphql = (0, _extends3.default)({}, decoratedClass.graphql, {
      queries: [].concat((0, _toConsumableArray3.default)(existingQueries), [{
        name: methodName,
        args: templateStrings.join('')
      }])
    });
  };
};

var subscription = exports.subscription = function subscription(templateStrings) {
  return function (_ref3, methodName) {
    var decoratedClass = _ref3.constructor;

    var existingSubscriptions = _lodash2.default.get(decoratedClass, 'graphql.subscriptions', []);

    decoratedClass.graphql = (0, _extends3.default)({}, decoratedClass.graphql, {
      subscriptions: [].concat((0, _toConsumableArray3.default)(existingSubscriptions), [{
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

  var body = queries.map(function (_ref4) {
    var name = _ref4.name,
        args = _ref4.args;
    return `  ${name} ${args}`;
  }).join('\n');
  return `type Query {\n${body}\n}\n`;
};

var extractMutations = function extractMutations(decoratedClass) {
  var mutations = _lodash2.default.get(decoratedClass, 'graphql.mutations');
  if (_lodash2.default.isEmpty(mutations)) {
    return '';
  }

  var body = mutations.map(function (_ref5) {
    var name = _ref5.name,
        args = _ref5.args;
    return `  ${name} ${args}`;
  }).join('\n');
  return `type Mutation {\n${body}\n}\n`;
};

var extractSubscriptions = function extractSubscriptions(decoratedClass) {
  var subscriptions = _lodash2.default.get(decoratedClass, 'graphql.subscriptions');
  if (_lodash2.default.isEmpty(subscriptions)) {
    return '';
  }

  var body = subscriptions.map(function (_ref6) {
    var name = _ref6.name,
        args = _ref6.args;
    return `  ${name} ${args}`;
  }).join('\n');
  return `type Subscription {\n${body}\n}\n`;
};

var toSchemaString = function toSchemaString(decoratedClass) {
  return _lodash2.default.filter([extractInput, extractType, extractQueries, extractMutations, extractEnums, extractSubscriptions].map(function (x) {
    return x(decoratedClass);
  })).join('\n');
};

var getOwnPropertyNames = _getOwnPropertyNames2.default,
    getPrototypeOf = _getPrototypeOf2.default;


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
var getSubscriptionMethods = function getSubscriptionMethods(classObject) {
  return _lodash2.default.map(_lodash2.default.get(classObject, 'graphql.subscriptions'), 'name');
};

var getSubqueryMethods = function getSubqueryMethods(classObject) {
  return _lodash2.default.difference(getClassMethods(classObject), getQueryMethods(classObject), getMutationMethods(classObject), getSubscriptionMethods(classObject));
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

var createSubscriptionMethod = function createSubscriptionMethod(classMethod, classMethodName) {
  return {
    subscribe: (0, _graphqlSubscriptions.withFilter)(function () {
      return pubsub.asyncIterator(classMethodName);
    }, function () {
      return classMethod.apply(undefined, arguments);
    })
  };
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
      _map$map$map2 = (0, _slicedToArray3.default)(_map$map$map, 3),
      Query = _map$map$map2[0],
      Mutation = _map$map$map2[1],
      TypeResolvers = _map$map$map2[2];

  var subscriptionsNames = getSubscriptionMethods(classObject);
  var subscriptionResolvers = subscriptionsNames.map(function (name) {
    return createSubscriptionMethod(objectInstance[name], name);
  });
  var Subscription = _lodash2.default.zipObject(subscriptionsNames, subscriptionResolvers);

  var resolvers = _lodash2.default.pickBy({
    Query,
    Mutation,
    Subscription,
    [classObject.name]: TypeResolvers
  }, _lodash2.default.size);

  return resolvers;
};

var toExcecutableSchema = function toExcecutableSchema(classInstance) {
  return (0, _graphqlTools.makeExecutableSchema)({
    typeDefs: toSchemaString(classInstance.constructor),
    resolvers: toResolvers(classInstance)
  });
};

var type = exports.type = function type(templateStrings) {
  return function (decoratedClass) {
    decoratedClass.graphql = (0, _extends3.default)({}, decoratedClass.graphql, {
      type: templateStrings.join('')
    });

    (0, _assign2.default)(decoratedClass.prototype, {
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
    decoratedClass.graphql = (0, _extends3.default)({}, decoratedClass.graphql, {
      input: templateStrings.join('')
    });

    (0, _assign2.default)(decoratedClass.prototype, {
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
    decoratedClass.graphql = (0, _extends3.default)({}, decoratedClass.graphql, {
      enum: templateStrings.join('')
    });

    (0, _assign2.default)(decoratedClass.prototype, {
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
  var graphQLClassesObjects = _lodash2.default.filter(classesObjects, function (_ref7) {
    var graphql = _ref7.graphql;
    return graphql;
  });

  return (0, _graphqlTools.makeExecutableSchema)({
    typeDefs: toMergedSchemasString(graphQLClassesObjects),
    resolvers: getMergedResolvers(graphQLClassesObjects)
  });
};

function generateSchemaJson(schemaContents) {
  var schema = (0, _graphql.buildASTSchema)((0, _graphql.parse)(schemaContents), { commentDescriptions: true });
  return (0, _graphql.graphql)(schema, _utilities.introspectionQuery);
}
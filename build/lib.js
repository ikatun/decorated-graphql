'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toExcecutableMergedSchema = exports.getMergedResolvers = exports.toMergedSchemasString = exports.Enum = exports.union = exports.Interface = exports.input = exports.type = exports.subscription = exports.query = exports.mutation = exports.description = exports.publish = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.generateSchemaJson = generateSchemaJson;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphqlTools = require('graphql-tools');

var _mergeGraphqlSchemas = require('merge-graphql-schemas');

var _graphql = require('graphql');

var _utilities = require('graphql/utilities');

var _graphqlSubscriptions = require('graphql-subscriptions');

var _graphqlTypeJson = require('graphql-type-json');

var _graphqlTypeJson2 = _interopRequireDefault(_graphqlTypeJson);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pubsub = new _graphqlSubscriptions.PubSub();
var publish = exports.publish = function publish(subscriptionName, msg) {
  return pubsub.publish(subscriptionName, { [subscriptionName]: msg });
};

var description = exports.description = function description(templateStrings) {
  return function (target, name) {
    var descriptionQL = `"""${templateStrings.join('')}"""\n`;

    if (name) {
      _lodash2.default.set(target.constructor, ['graphql', 'descriptions', name], descriptionQL);
    } else {
      _lodash2.default.set(target, 'graphql.description', descriptionQL);
    }
  };
};

var mutation = exports.mutation = function mutation(templateStrings) {
  return function (_ref, methodName) {
    var decoratedClass = _ref.constructor;

    (0, _utils.deepMergeAt)(decoratedClass, 'graphql.mutations', [{
      name: methodName,
      args: templateStrings.join('')
    }]);
  };
};

var query = exports.query = function query(templateStrings) {
  return function (_ref2, methodName) {
    var decoratedClass = _ref2.constructor;

    (0, _utils.deepMergeAt)(decoratedClass, 'graphql.queries', [{
      name: methodName,
      args: templateStrings.join('')
    }]);
  };
};

var subscription = exports.subscription = function subscription(templateStrings) {
  return function (_ref3, methodName) {
    var decoratedClass = _ref3.constructor;

    (0, _utils.deepMergeAt)(decoratedClass, 'graphql.subscriptions', [{
      name: methodName,
      args: templateStrings.join('')
    }]);
  };
};

var extractType = function extractType(decoratedClass) {
  return (0, _utils.graphQLMetadataToString)(decoratedClass, 'type');
};
var extractInput = function extractInput(decoratedClass) {
  return (0, _utils.graphQLMetadataToString)(decoratedClass, 'input');
};
var extractEnum = function extractEnum(decoratedClass) {
  return (0, _utils.graphQLMetadataToString)(decoratedClass, 'enum');
};
var extractInterface = function extractInterface(decoratedClass) {
  return (0, _utils.graphQLMetadataToString)(decoratedClass, 'interface');
};
var extractUnion = function extractUnion(decoratedClass) {
  var union = _lodash2.default.get(decoratedClass, 'graphql.union');
  if (!union) {
    return '';
  }

  return `union ${(0, _utils.getName)(decoratedClass)} = ${union}\n`;
};

var extractQueries = function extractQueries(decoratedClass) {
  return (0, _utils.integratedGraphQLTypeToString)(decoratedClass, 'Query', 'queries');
};
var extractMutations = function extractMutations(decoratedClass) {
  return (0, _utils.integratedGraphQLTypeToString)(decoratedClass, 'Mutation', 'mutations');
};
var extractSubscriptions = function extractSubscriptions(decoratedClass) {
  return (0, _utils.integratedGraphQLTypeToString)(decoratedClass, 'Subscription', 'subscriptions');
};

var toSchemaString = function toSchemaString(decoratedClass) {
  return _lodash2.default.filter([extractInput, extractType, extractInterface, extractUnion, extractQueries, extractMutations, extractEnum, extractSubscriptions].map(function (x) {
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
    }, function (payload, variables) {
      for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
      }

      return classMethod.apply(undefined, [_extends({}, payload, payload[classMethodName]), variables].concat(args));
    })
  };
};

var toResolvers = function toResolvers(classInstance) {
  var objectInstance = convertToObject(classInstance);
  var classObject = classInstance.constructor;
  var typeName = (0, _utils.getName)(classObject);

  var _map$map$map = [getQueryMethods, getMutationMethods, getSubqueryMethods].map(function (selectMethods) {
    return selectMethods(classObject);
  }).map(function (methods) {
    return _lodash2.default.pick(objectInstance, methods);
  }).map(function (x) {
    return _lodash2.default.isEmpty(x) ? undefined : x;
  }),
      _map$map$map2 = _slicedToArray(_map$map$map, 3),
      query = _map$map$map2[0],
      mutation = _map$map$map2[1],
      typeResolvers = _map$map$map2[2];

  var subscriptionsNames = getSubscriptionMethods(classObject);
  var subscriptionResolvers = subscriptionsNames.map(function (name) {
    return createSubscriptionMethod(objectInstance[name], name);
  });
  var subscription = _lodash2.default.zipObject(subscriptionsNames, subscriptionResolvers);

  var resolvers = _lodash2.default.pickBy({
    Query: _lodash2.default.mapValues(query, function (func) {
      return function (ignoredRootValue) {
        for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        return func.apply(undefined, args);
      };
    }),
    Mutation: _lodash2.default.mapValues(mutation, function (func) {
      return function (ignoredRootValue) {
        for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
          args[_key3 - 1] = arguments[_key3];
        }

        return func.apply(undefined, args);
      };
    }),
    Subscription: subscription,
    [typeName]: typeResolvers
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
    return (0, _utils.deepMergeAt)(decoratedClass, 'graphql.type', templateStrings.join(''));
  };
};
var input = exports.input = function input(templateStrings) {
  return function (decoratedClass) {
    return (0, _utils.deepMergeAt)(decoratedClass, 'graphql.input', templateStrings.join(''));
  };
};
var Interface = exports.Interface = function Interface(templateStrings) {
  return function (decoratedClass) {
    return (0, _utils.deepMergeAt)(decoratedClass, 'graphql.interface', templateStrings.join(''));
  };
};
var union = exports.union = function union(templateStrings) {
  return function (decoratedClass) {
    return (0, _utils.deepMergeAt)(decoratedClass, 'graphql.union', templateStrings.join(''));
  };
};
var Enum = exports.Enum = function Enum(templateStrings) {
  return function (decoratedClass) {
    return (0, _utils.deepMergeAt)(decoratedClass, 'graphql.enum', templateStrings.join(''));
  };
};

var jsonSchemaString = `
  scalar JSON
`;

var toMergedSchemasString = exports.toMergedSchemasString = function toMergedSchemasString(classesObjects) {
  return (0, _mergeGraphqlSchemas.mergeTypes)(_lodash2.default.map(classesObjects, toSchemaString).concat(jsonSchemaString));
};

var getMergedResolvers = exports.getMergedResolvers = function getMergedResolvers(classesObjects) {
  return (0, _mergeGraphqlSchemas.mergeResolvers)(_lodash2.default.map(classesObjects, function (X) {
    return new X();
  }).map(toResolvers));
};

var toExcecutableMergedSchema = exports.toExcecutableMergedSchema = function toExcecutableMergedSchema(classesObjects) {
  var typeDefs = toMergedSchemasString(classesObjects);
  var resolvers = getMergedResolvers(classesObjects);

  return (0, _graphqlTools.makeExecutableSchema)({
    typeDefs: typeDefs,
    resolvers: _extends({}, resolvers, { JSON: _graphqlTypeJson2.default })
  });
};

function generateSchemaJson(schemaContents) {
  var schema = (0, _graphql.buildASTSchema)((0, _graphql.parse)(schemaContents), { commentDescriptions: true });
  return (0, _graphql.graphql)(schema, _utilities.introspectionQuery);
}
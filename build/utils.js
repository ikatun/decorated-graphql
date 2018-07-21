'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getName = exports.deepMerge = undefined;
exports.deepMergeAt = deepMergeAt;
exports.graphQLMetadataToString = graphQLMetadataToString;
exports.integratedGraphQLTypeToString = integratedGraphQLTypeToString;

var _lodash = require('lodash');

function customizer(objValue, srcValue) {
  if ((0, _lodash.isArray)(objValue)) {
    return objValue.concat(srcValue);
  }
}

var deepMerge = exports.deepMerge = function deepMerge(object, source) {
  return (0, _lodash.mergeWith)(object, source, customizer);
};

function deepMergeAt(object, key, source) {
  var deepSource = {};
  (0, _lodash.set)(deepSource, key, source);
  deepMerge(object, deepSource);
}

var getName = exports.getName = function getName(decoratedClass) {
  return (0, _lodash.get)(decoratedClass, 'graphql.name', decoratedClass.name);
};

function graphQLMetadataToString(decoratedClass, metadataName) {
  var className = getName(decoratedClass);
  var body = (0, _lodash.get)(decoratedClass, ['graphql', metadataName]);
  if (!body) {
    return '';
  }

  var descriptionQL = (0, _lodash.get)(decoratedClass, 'graphql.description', '');

  return `${descriptionQL}${metadataName} ${className} { ${body}\n}\n`;
}

function integratedGraphQLTypeToString(decoratedClass, typeName, pluralName) {
  var items = (0, _lodash.get)(decoratedClass, ['graphql', pluralName]);
  if ((0, _lodash.isEmpty)(items)) {
    return '';
  }

  var body = items.map(function (_ref) {
    var name = _ref.name,
        args = _ref.args;

    var description = (0, _lodash.get)(decoratedClass, ['graphql', 'descriptions', name], '');
    return `${description}${name} ${args}`;
  }).join('\n');

  var descriptionQL = (0, _lodash.get)(decoratedClass, 'graphql.description', '');
  return `${descriptionQL}type ${typeName} {\n${body}\n}\n`;
}
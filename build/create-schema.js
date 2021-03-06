'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSchemaFiles = createSchemaFiles;
exports.default = createSchema;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _lib = require('./lib');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var glob = null;

try {
  glob = require('glob');
} catch (e) {
  console.error('You need `glob` package to use deocrated-graphql helpers');
  process.exit(-1);
}

var schemaPrefix = `schema {
  query: Query
  mutation: Mutation
}`;

function createSchemaFiles(schemaDestPath, mergedSchema) {
  _fs2.default.writeFileSync(_path2.default.join(schemaDestPath, 'graphql.graphql'), mergedSchema, 'utf8');

  (0, _lib.generateSchemaJson)(mergedSchema).then(function (json) {
    _fs2.default.writeFileSync(_path2.default.join(schemaDestPath, 'graphql.schema.json'), JSON.stringify(json, null, 2), 'utf8');
  });
}

function createSchema(srcDir) {
  var schemaDestPath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _path2.default.join(srcDir, '..');

  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref$resolversNamePat = _ref.resolversNamePattern,
      resolversNamePattern = _ref$resolversNamePat === undefined ? '**/*.graphql.js' : _ref$resolversNamePat;

  var requiredModules = glob.sync(_path2.default.join(srcDir, resolversNamePattern)).map(require);
  var all = _lodash2.default.flatten(requiredModules.map(_lodash2.default.values)).filter(function (_ref2) {
    var graphql = _ref2.graphql;
    return graphql;
  });
  var executableMergedSchema = (0, _lib.toExcecutableMergedSchema)(all);

  var mergedSchema = (0, _lib.toMergedSchemasString)(all).replace(schemaPrefix, '');

  if (schemaDestPath) {
    createSchemaFiles(schemaDestPath, mergedSchema);
  }

  return executableMergedSchema;
};
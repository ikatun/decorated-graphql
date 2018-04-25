import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { generateSchemaJson, toExcecutableMergedSchema, toMergedSchemasString } from './lib';
let glob = null;

try {
  glob = require('glob');
} catch (e) {
  console.error('You need `glob` package to use deocrated-graphql helpers');
  process.exit(-1);
}

const schemaPrefix = `schema {
  query: Query
  mutation: Mutation
}`;

export default (srcDir, schemaDestPath = path.join(srcDir, '..')) => {
  const requiredModules = glob.sync(path.join(srcDir, '**/*.graphql.js')).map(require);
  const all = _.flatten(requiredModules.map(_.values)).filter(({ graphql }) => graphql);
  const executableMergedSchema = toExcecutableMergedSchema(all);

  const mergedSchema = toMergedSchemasString(all).replace(schemaPrefix, '');

  if (schemaDestPath) {
    createSchemaFiles(schemaDestPath, mergedSchema);
  }

  return executableMergedSchema;
};

export function createSchemaFiles(schemaDestPath, mergedSchema) {
  fs.writeFileSync(
    path.join(schemaDestPath, 'graphql.graphql'),
    mergedSchema,
    'utf8',
  );

  generateSchemaJson(mergedSchema).then((json) => {
    fs.writeFileSync(
      path.join(schemaDestPath, 'graphql.schema.json'),
      JSON.stringify(json, null, 2),
      'utf8',
    );
  });
}

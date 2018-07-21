import { mergeWith, set, isEmpty, get } from 'lodash';

function customizer(objValue, srcValue) {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

export const deepMerge = (object: Object, source: Object) => mergeWith(object, source, customizer);

export function deepMergeAt(object: Object, key: string, source: Object) {
  const deepSource = {};
  set(deepSource, key, source);
  deepMerge(object, deepSource);
}

export const getName = decoratedClass => _.get(decoratedClass, 'graphql.name', decoratedClass.name);

export function graphQLMetadataToString(decoratedClass, metadataName) {
  const className = getName(decoratedClass);
  const body = get(decoratedClass, ['graphql', metadataName]);
  if (!body) {
    return '';
  }

  return `input ${className} { ${body}\n}\n`;
}

export function integratedGraphQLTypeToString(decoratedClass, typeName: string, pluralName: string) {
  const items = get(decoratedClass, ['graphql', pluralName]);
  if (isEmpty(items)) {
    return '';
  }

  const body = items.map(({ name, args }) => `  ${name} ${args}`).join('\n');
  return `type ${typeName} {\n${body}\n}\n`;
}

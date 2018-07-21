import _ from 'lodash';
import { makeExecutableSchema } from 'graphql-tools';
import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
import { buildASTSchema, graphql, parse } from 'graphql';
import { introspectionQuery } from 'graphql/utilities';
import { withFilter, PubSub } from 'graphql-subscriptions';
import GraphQLJSON from 'graphql-type-json';

import { deepMergeAt, getName, graphQLMetadataToString, integratedGraphQLTypeToString } from './utils';

const pubsub = new PubSub();
export const publish = (subscriptionName, msg) => pubsub.publish(subscriptionName, { [subscriptionName]: msg });

export const mutation = templateStrings => ({ constructor: decoratedClass }, methodName) => {
  deepMergeAt(decoratedClass, 'graphql.mutations', [{
    name: methodName,
    args: templateStrings.join(''),
  }]);
};

export const query = templateStrings => ({ constructor: decoratedClass }, methodName) => {
  deepMergeAt(decoratedClass, 'graphql.queries', [{
    name: methodName,
    args: templateStrings.join(''),
  }]);
};

export const subscription = templateStrings => ({ constructor: decoratedClass }, methodName) => {
  deepMergeAt(decoratedClass, 'graphql.subscriptions', [{
    name: methodName,
    args: templateStrings.join(''),
  }])
};

const extractType = (decoratedClass) => graphQLMetadataToString(decoratedClass, 'type');
const extractInput = (decoratedClass) => graphQLMetadataToString(decoratedClass, 'input');
const extractEnum = (decoratedClass) => graphQLMetadataToString(decoratedClass, 'enum');
const extractInterface = (decoratedClass) => graphQLMetadataToString(decoratedClass, 'interface');
const extractUnion = (decoratedClass) => graphQLMetadataToString(decoratedClass, 'union');

const extractQueries = (decoratedClass) => integratedGraphQLTypeToString(decoratedClass, 'Query', 'queries');
const extractMutations = (decoratedClass) => integratedGraphQLTypeToString(decoratedClass, 'Mutation', 'mutations');
const extractSubscriptions = (decoratedClass) =>
  integratedGraphQLTypeToString(decoratedClass, 'Subscription', 'subscriptions');

const toSchemaString = decoratedClass =>
  _.filter([extractInput,
    extractType,
    extractInterface,
    extractUnion,
    extractQueries,
    extractMutations,
    extractEnum,
    extractSubscriptions,
  ].map(x => x(decoratedClass)))
    .join('\n');

const { getOwnPropertyNames, getPrototypeOf } = Object;

const ignoredMethods = [
  'constructor',
  'getResolvers',
  'toSchemaString',
  'toExcecutableSchema',
];

const getClassMethods = classObject => _.difference(getOwnPropertyNames(classObject.prototype), ignoredMethods);
const getQueryMethods = classObject => _.map(_.get(classObject, 'graphql.queries'), 'name');
const getMutationMethods = classObject => _.map(_.get(classObject, 'graphql.mutations'), 'name');
const getSubscriptionMethods = classObject => _.map(_.get(classObject, 'graphql.subscriptions'), 'name');

const getSubqueryMethods = classObject =>
  _.difference(
    getClassMethods(classObject),
    getQueryMethods(classObject),
    getMutationMethods(classObject),
    getSubscriptionMethods(classObject),
  );

const convertToObject = (classInstance) => {
  const propertyNames = getOwnPropertyNames(getPrototypeOf(classInstance)).filter(x => x !== 'constructor');
  const properties = propertyNames.map(name => classInstance[name]);

  return _.zipObject(propertyNames, properties);
};

const createSubscriptionMethod = (classMethod, classMethodName) => {
  return {
    subscribe: withFilter(
      () => pubsub.asyncIterator(classMethodName),
      (payload, variables, ...args) => classMethod({ ...payload, ...payload[classMethodName] }, variables, ...args),
    )
  }
};

const toResolvers = (classInstance) => {
  const objectInstance = convertToObject(classInstance);
  const classObject = classInstance.constructor;
  const typeName = getName(classObject);

  const [query, mutation, typeResolvers] =
    [getQueryMethods, getMutationMethods, getSubqueryMethods]
      .map(selectMethods => selectMethods(classObject))
      .map(methods => _.pick(objectInstance, methods))
      .map(x => _.isEmpty(x) ? undefined : x);

  const subscriptionsNames = getSubscriptionMethods(classObject);
  const subscriptionResolvers = subscriptionsNames.map(name => createSubscriptionMethod(objectInstance[name], name));
  const subscription = _.zipObject(subscriptionsNames, subscriptionResolvers);

  const resolvers =_.pickBy({
    Query: _.mapValues(query, func => (ignoredRootValue, ...args) => func(...args)),
    Mutation: _.mapValues(mutation, func => (ignoredRootValue, ...args) => func(...args)),
    Subscription: subscription,
    [typeName]: typeResolvers,
  }, _.size);

  return resolvers;
};

const toExcecutableSchema = classInstance => makeExecutableSchema({
  typeDefs: toSchemaString(classInstance.constructor),
  resolvers: toResolvers(classInstance),
});

export const type = templateStrings => (decoratedClass) => {
  decoratedClass.graphql = {
    ...decoratedClass.graphql,
    type: templateStrings.join(''),
  };

  Object.assign(decoratedClass.prototype, {
    toExcecutableSchema() {
      return toExcecutableSchema(this);
    },
    toSchemaString() {
      return toSchemaString(decoratedClass);
    },
    getResolvers() {
      return toResolvers(this);
    },
  });
};

export const input = templateStrings => (decoratedClass) => {
  decoratedClass.graphql = {
    ...decoratedClass.graphql,
    input: templateStrings.join(''),
  };

  Object.assign(decoratedClass.prototype, {
    toExcecutableSchema() {
      return toExcecutableSchema(this);
    },
    toSchemaString() {
      return toSchemaString(decoratedClass);
    },
    getResolvers() {
      return toResolvers(this);
    },
  });
};


export const Interface = templateStrings => (decoratedClass) => {
  decoratedClass.graphql = {
    ...decoratedClass.graphql,
    interface: templateStrings.join(''),
  };

  Object.assign(decoratedClass.prototype, {
    toExcecutableSchema() {
      return toExcecutableSchema(this);
    },
    toSchemaString() {
      return toSchemaString(decoratedClass);
    },
    getResolvers() {
      return toResolvers(this);
    },
  });
};

export const union = templateStrings => (decoratedClass) => {
  decoratedClass.graphql = {
    ...decoratedClass.graphql,
    union: templateStrings.join(''),
  };

  Object.assign(decoratedClass.prototype, {
    toExcecutableSchema() {
      return toExcecutableSchema(this);
    },
    toSchemaString() {
      return toSchemaString(decoratedClass);
    },
    getResolvers() {
      return toResolvers(this);
    },
  });
};

export const Enum = templateStrings => (decoratedClass) => {
  decoratedClass.graphql = {
    ...decoratedClass.graphql,
    enum: templateStrings.join(''),
  };

  Object.assign(decoratedClass.prototype, {
    toExcecutableSchema() {
      return toExcecutableSchema(this);
    },
    toSchemaString() {
      return toSchemaString(decoratedClass);
    },
    getResolvers() {
      return toResolvers(this);
    },
  });
};

const jsonSchemaString = `
  scalar JSON
`;

export const toMergedSchemasString = classesObjects =>
  mergeTypes(_.map(classesObjects, toSchemaString).concat(jsonSchemaString));

export const getMergedResolvers = classesObjects =>
  mergeResolvers(_.map(classesObjects, X => new X()).map(toResolvers));


export const toExcecutableMergedSchema = (classesObjects) => {
  return makeExecutableSchema({
    typeDefs: toMergedSchemasString(classesObjects),
    resolvers: {
      ...getMergedResolvers(classesObjects),
      JSON: GraphQLJSON,
    },
  });
};

export function generateSchemaJson(schemaContents: string) {
  const schema = buildASTSchema(parse(schemaContents), { commentDescriptions: true });
  return graphql(schema, introspectionQuery);
}

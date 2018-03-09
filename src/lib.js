import _ from 'lodash';
import { makeExecutableSchema } from 'graphql-tools';
import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
import { buildASTSchema, graphql, parse } from 'graphql';
import { introspectionQuery } from 'graphql/utilities';
import { withFilter, PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();
export const publish = (subscriptionName, msg) => pubsub.publish(subscriptionName, { [subscriptionName]: msg });

export const mutation = templateStrings => ({ constructor: decoratedClass }, methodName) => {
  const existingMutations = _.get(decoratedClass, 'graphql.mutations', []);

  decoratedClass.graphql = {
    ...decoratedClass.graphql,
    mutations: [...existingMutations, {
      name: methodName,
      args: templateStrings.join(''),
    }],
  };
};

export const query = templateStrings => ({ constructor: decoratedClass }, methodName) => {
  const existingQueries = _.get(decoratedClass, 'graphql.queries', []);

  decoratedClass.graphql = {
    ...decoratedClass.graphql,
    queries: [...existingQueries, {
      name: methodName,
      args: templateStrings.join(''),
    }],
  };
};

export const subscription = templateStrings => ({ constructor: decoratedClass }, methodName) => {
  const existingSubscriptions = _.get(decoratedClass, 'graphql.subscriptions', []);

  decoratedClass.graphql = {
    ...decoratedClass.graphql,
    subscriptions: [...existingSubscriptions, {
      name: methodName,
      args: templateStrings.join(''),
    }],
  };
};

const extractType = (decoratedClass) => {
  const { name: className } = decoratedClass;
  const type = _.get(decoratedClass, 'graphql.type');
  if (!type) {
    return '';
  }

  return `type ${className} { ${type}\n}\n`;
};

const extractInput = (decoratedClass) => {
  const { name: className } = decoratedClass;
  const input = _.get(decoratedClass, 'graphql.input');
  if (!input) {
    return '';
  }

  return `input ${className} { ${input}\n}\n`;
};

const extractEnums = (decoratedClass) => {
  const { name: className } = decoratedClass;
  const Enum = _.get(decoratedClass, 'graphql.enum');
  if (!Enum) {
    return '';
  }

  return `enum ${className} { ${Enum}\n}\n`;
};

const extractQueries = (decoratedClass) => {
  const queries = _.get(decoratedClass, 'graphql.queries');
  if (_.isEmpty(queries)) {
    return '';
  }

  const body = queries.map(({ name, args }) => `  ${name} ${args}`).join('\n');
  return `type Query {\n${body}\n}\n`;
};

const extractMutations = (decoratedClass) => {
  const mutations = _.get(decoratedClass, 'graphql.mutations');
  if (_.isEmpty(mutations)) {
    return '';
  }

  const body = mutations.map(({ name, args }) => `  ${name} ${args}`).join('\n');
  return `type Mutation {\n${body}\n}\n`;
};

const extractSubscriptions = (decoratedClass) => {
  const subscriptions = _.get(decoratedClass, 'graphql.subscriptions');
  if (_.isEmpty(subscriptions)) {
    return '';
  }

  const body = subscriptions.map(({ name, args }) => `  ${name} ${args}`).join('\n');
  return `type Subscription {\n${body}\n}\n`;
};

const toSchemaString = decoratedClass =>
  _.filter([
    extractInput,
    extractType,
    extractQueries,
    extractMutations,
    extractEnums,
    extractSubscriptions
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
    [classObject.name]: typeResolvers,
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

export const toMergedSchemasString = classesObjects =>
  mergeTypes(_.map(classesObjects, toSchemaString));

export const getMergedResolvers = classesObjects =>
  mergeResolvers(_.map(classesObjects, X => new X()).map(toResolvers));

export const toExcecutableMergedSchema = (classesObjects) => {
  return makeExecutableSchema({
    typeDefs: toMergedSchemasString(classesObjects),
    resolvers: getMergedResolvers(classesObjects),
  });
};

export function generateSchemaJson(schemaContents: string) {
  const schema = buildASTSchema(parse(schemaContents), { commentDescriptions: true });
  return graphql(schema, introspectionQuery);
}

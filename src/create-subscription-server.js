import { SubscriptionServer } from 'subscriptions-transport-ws';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';

const createSubscriptionServer = (expressApp, schema, path) => {
  const ws = createServer(expressApp);

  SubscriptionServer.create({
    execute,
    subscribe,
    schema
  }, {
    server: ws,
    path,
  });

  return ws;
};

export default createSubscriptionServer;

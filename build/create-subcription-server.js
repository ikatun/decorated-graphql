'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _subscriptionsTransportWs = require('subscriptions-transport-ws');

var _http = require('http');

var _graphql = require('graphql');

var createSubscriptionServer = function createSubscriptionServer(expressApp, schema, path) {
  var ws = (0, _http.createServer)(expressApp);

  _subscriptionsTransportWs.SubscriptionServer.create({
    execute: _graphql.execute,
    subscribe: _graphql.subscribe,
    schema
  }, {
    server: ws,
    path
  });

  return ws;
};

exports.default = createSubscriptionServer;
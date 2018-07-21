# decorated-graphql
A few node decorators for building GraphQL API.
They allow you to use GraphQL schema as type declarations for your resolvers.

## Requirements
Your project setup must support decorators and the code must be run without class names minimalization.

## Installation
```
npm install decorated-graphql
```

## Example code snippet
```JS
import { type, query, subscription, mutation, publish, description, union, Enum, Interface } from 'decorated-graphql';

export const users = [{
  id: 1,
  username: 'user1',
  meta: { birthday: '02-02-1990', name: 'Tom' },
}, {
  id: 2,
  username: 'user2',
  meta: { birthday: '10-11-2001', name: 'Matt' },
}];

export const messages = [{
  id: 1,
  senderId: 1,
  recvId: 2,
  content: 'blabla',
}];

// User.graphql.js file
@type`
  id: ID
  username: String
  meta: JSON`
export class User {
  @query`: [User]`
  users() {
    return users;
  }
}

// Message.graphql.js file
@description`Represents a message sent from one user to another`
@type`
  id: ID
  """ id of the sending user """ senderId: ID
  """ id of receiving user """ recvId: ID
  content: String
  recver: User`
export class Message {
  @description`Used to create a single message`
  @mutation`(senderId: ID, recvId: ID, content: String): Message`
  createMessage(message) {
    const newMessage = { ...message, id: (messages.length + 1).toString() };
    messages.push(newMessage);

    publish('onMessageCreated', newMessage);

    return newMessage;
  }

  @query`: [Message]`
  messages() {
    return messages;
  }

  @subscription`(recvId: ID): Message`
  onMessageCreated(newMessage, variables) {
    return newMessage.recvId === variables.recvId;
  }
}

// Anything.graphql.js file
@union`User | Message`
export class Anything {
  __resolveType(anything) {
    if (anything.content) {
      return 'Message';
    }
    return 'User';
  }
  @query`: [Anything]`
  allData() {
    return users.concat(messages);
  }
}
```
## Example server code with subscriptions
```
import express from 'express';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import bodyParser from 'body-parser';
import createSchema from 'decorated-graphql/build/create-schema';
import createSubscriptionServer from 'decorated-graphql/build/create-subscription-server'

const app = express();

const schema = createSchema(`${__dirname}/..`); // path to directory containing `.graphql.js` files with exported graphql decorated classes

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.use('/', graphiqlExpress({
  endpointURL: '/graphql',
  subscriptionsEndpoint: 'ws://localhost:3000/subscriptions'
}));

const ws = createSubscriptionServer(app, schema, '/subscriptions');

ws.listen(3000, () => {
  console.log('Go visit http://localhost:3000');
});

```

## Example project
An example project already setup and ready to run: https://github.com/ikatun/graphql-project.
It's using [nnode](https://github.com/ikatun/nnode) to run any JS code on any node version without transpilation.

const meshbluHttpFactory = require('../../factories/meshbluHttpFactory');

async function createUser(client) {
  // Actual registration must be done with meshblu-authenticator-core.
  return client.registerAsync({
    type: 'user',
    meshblu: {
      version: '2.0.0',
    },
  });
}

async function createRouter(client, user) {
  return client.registerAsync({
    type: 'router',
    meshblu: {
      version: '2.0.0',
      whitelists: {
        discover: {
          // Allow the user to view the router
          // Required to update the router's whitelists when creating other devices
          view: [{ uuid: user.uuid }],
        },
        configure: {
          // Allow the user to update the router
          // Required to setup subscriptions and update whitelists when creating other devices
          update: [{ uuid: user.uuid }],
        },
      },
    },
  });
}

async function subscribeOwn(client, uuid, type, as) {
  await client.createSubscriptionAsync({
    subscriberUuid: uuid,
    emitterUuid: uuid,
    type,
  }, { as });
}

async function createRouterSubscriptions(client, router, user) {
  // In order to receive messages, a device must subscribe to its own messages
  // https://meshblu.readme.io/docs/subscriptions-2-0#example

  // Listen to broadcasts received from things
  // Required to receive/forward broadcasts received ('data')
  await subscribeOwn(client, router.uuid, 'broadcast.received', user.uuid);
  // Listen to configure received from things
  // Required to receive/forward configure received ('schema', 'update')
  await subscribeOwn(client, router.uuid, 'configure.received', user.uuid);
}

async function assignRouterToUser(client, router, user) {
  // Save the router UUID for easy access when creating other devices
  await client.updateAsync(user.uuid, {
    knot: {
      router: router.uuid,
    },
  });
}

async function reloadUser(client, user) {
  const updatedUser = await client.deviceAsync(user.uuid, { as: user.uuid });
  updatedUser.token = user.token; // Token is hashed after register
  return updatedUser;
}

async function registerUser(argv) {
  const anonymousClient = meshbluHttpFactory(argv);
  const user = await createUser(anonymousClient);

  const userClient = meshbluHttpFactory(argv, user);
  const router = await createRouter(userClient, user);
  await createRouterSubscriptions(userClient, router, user);
  await assignRouterToUser(userClient, router, user);

  return reloadUser(userClient, user);
}

module.exports = {
  command: 'user',
  desc: 'Register a user device',
  handler: async (argv) => {
    /* eslint-disable no-console */
    try {
      const user = await registerUser(argv);
      console.log(JSON.stringify(user, null, 2));
    } catch (error) {
      console.error(`Failed registering user: ${error.message}`);
      console.error(error);
    }
    /* eslint-enable no-console */
  },
};

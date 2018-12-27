const _ = require('lodash');
const loadCredentials = require('../../loadCredentials');
const meshbluHttpFactory = require('../../factories/meshbluHttpFactory');

async function getAuthenticatedDevice(client) {
  return client.whoamiAsync();
}

function verifyPermissions(authenticatedDevice) {
  if (authenticatedDevice.type !== 'user') {
    throw new Error('Only users can create apps');
  }
}

async function createApp(client, user, options) {
  return client.registerAsync({
    type: 'app',
    metadata: {
      name: options.name,
    },
    knot: {
      router: user.knot.router, // Saved for easy access when interacting with things
    },
    meshblu: {
      version: '2.0.0',
      whitelists: {
        discover: {
          // Allow user to view the app
          // Required to list and update the app
          view: [{ uuid: user.uuid }],
        },
        configure: {
          // Allow user to update the app
          // Required to update the app
          update: [{ uuid: user.uuid }],
        },
      },
    },
  });
}

function pathToObject(path) {
  /* eslint-disable no-multi-spaces */
  return _.chain(path)                                // 'broadcast.received'
    .toPath()                                         // ['broadcast', 'received']
    .reverse()                                        // ['received', 'broadcast']
    .reduce((acc, step) => _.set({}, step, acc), [])  // { broadcast: { received: [] }}
    .value();
  /* eslint-enable no-multi-spaces */
}

function pushToWhitelist(device, type, uuid) {
  _.defaultsDeep(device, { meshblu: { whitelists: pathToObject(type) } });
  _.get(device, `meshblu.whitelists.${type}`).push({ uuid });
}

async function givePermission(client, from, to, type, as) {
  const device = await client.deviceAsync(from);
  pushToWhitelist(device, type, to);
  await client.updateAsync(from, { meshblu: device.meshblu }, { as });
}

async function subscribe(client, from, to, type, as) {
  await client.createSubscriptionAsync({
    subscriberUuid: to,
    emitterUuid: from,
    type,
  }, { as });
}

async function subscribeOwn(client, uuid, type, as) {
  await subscribe(client, uuid, uuid, type, as);
}

async function connectRouterToApp(client, user, app) {
  // Listen to broadcasts the router receives
  // Required to receive 'data'/'schema'/'config' from things
  await givePermission(client, user.knot.router, app.uuid, 'broadcast.received', user.uuid);
  await subscribeOwn(client, app.uuid, 'broadcast.received', user.uuid);
  await subscribe(client, user.knot.router, app.uuid, 'broadcast.received', user.uuid);

  // Allow the app to send messages as the router
  // Required to send commands ('set_data', 'get_data', 'set_config', 'get_config') to things
  await givePermission(client, user.knot.router, app.uuid, 'message.as', user.uuid);

  // Allow the app to discover and update as if it was the router
  // Required to list and ...?
  await givePermission(client, user.knot.router, app.uuid, 'discover.as', user.uuid);
  await givePermission(client, user.knot.router, app.uuid, 'configure.as', user.uuid);
}

async function registerApp(argv) {
  const client = meshbluHttpFactory(argv, argv.credentials);
  const user = await getAuthenticatedDevice(client);
  verifyPermissions(user);

  const app = await createApp(client, user, argv);
  await connectRouterToApp(client, user, app);

  return app;
}

module.exports = {
  command: 'app [name]',
  desc: 'Register an app device',
  builder: yargs => yargs
    .option('credentials', {
      alias: 'c',
      desc: 'User credentials file (JSON)',
      demandOption: true,
      coerce: loadCredentials,
    })
    .positional('name', {
      desc: 'App name',
      type: 'string',
      default: 'My app',
    }),
  handler: async (argv) => {
    /* eslint-disable no-console */
    try {
      const app = await registerApp(argv);
      console.log(JSON.stringify(app, null, 2));
    } catch (error) {
      console.error(`Failed registering app: ${error.message}`);
    }
    /* eslint-enable no-console */
  },
};

const _ = require('lodash');
const loadCredentials = require('../../loadCredentials');
const meshbluHttpFactory = require('../../factories/meshbluHttpFactory');

async function getAuthenticatedDevice(client) {
  return client.whoamiAsync();
}

function verifyPermissions(authenticatedDevice) {
  if (authenticatedDevice.type !== 'user') {
    throw new Error('Only users can create gateways');
  }
}

async function createGateway(client, user, options) {
  return client.registerAsync({
    type: 'gateway',
    metadata: {
      name: options.name,
    },
    knot: {
      user: user.uuid, // Saved for easy access when creating things
      router: user.knot.router, // Saved for easy access when creating things
      active: options.active, // To indicate a gateway hardware is using these credentials
    },
    meshblu: {
      version: '2.0.0',
      whitelists: {
        discover: {
          // Allow user to view the gateway
          // Required when listing/updating the gateways
          view: [{ uuid: user.uuid }],
        },
        configure: {
          // Allow user to update the gateway
          // Required when updating the gateway
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

async function connectRouterToGateway(client, user, gateway) {
  // Allow the gateway to update the router
  // Required to create things (update router's whitelists)
  await givePermission(client, user.knot.router, gateway.uuid, 'configure.update', user.uuid);
}

async function registerGateway(argv) {
  const client = meshbluHttpFactory(argv, argv.credentials);

  const user = await getAuthenticatedDevice(client);
  verifyPermissions(user);

  const gateway = await createGateway(client, user, argv);
  await connectRouterToGateway(client, user, gateway);

  return gateway;
}

module.exports = {
  command: 'gateway [name]',
  desc: 'Register a gateway device',
  builder: yargs => yargs
    .option('credentials', {
      alias: 'c',
      desc: 'User credentials file (JSON)',
      demandOption: true,
      coerce: loadCredentials,
    })
    .option('active', {
      alias: 'a',
      desc: 'Mark gateway as active',
      type: 'boolean',
      demandOption: true,
      default: false,
    })
    .positional('name', {
      desc: 'Gateway name',
      type: 'string',
      default: 'My gateway',
    }),
  handler: async (argv) => {
    /* eslint-disable no-console */
    try {
      const app = await registerGateway(argv);
      console.log(JSON.stringify(app, null, 2));
    } catch (error) {
      console.error(`Failed registering gateway: ${error.message}`);
    }
    /* eslint-enable no-console */
  },
};

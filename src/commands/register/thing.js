const loadCredentials = require('../../loadCredentials');
const meshbluHttpFactory = require('../../factories/meshbluHttpFactory');

async function getAuthenticatedDevice(client) {
  return client.whoamiAsync();
}

function verifyPermissions(authenticatedDevice) {
  if (authenticatedDevice.type !== 'user' && authenticatedDevice.type !== 'gateway') {
    throw new Error('Only users or gateways can create things');
  }
}

async function createThing(client, device, options) {
  const params = {
    type: 'thing',
    metadata: {
      name: options.name,
    },
    knot: {
      gateways: [],
    },
    meshblu: {
      version: '2.0.0',
      whitelists: {
        discover: {
          view: [
            // Allow the router to view the thing
            // Required to allow apps to list things
            { uuid: device.knot.router },
            // Allow the device (gateway or user) to view the thing
            { uuid: device.uuid },
          ],
        },
        configure: {
          update: [
            // Allow the router to update the thing
            // Required to allow apps to update things
            { uuid: device.knot.router },
            // Allow the device (gateway or user) to update the thing
            { uuid: device.uuid },
          ],
        },
        broadcast: {
          // Allow the router to receive broadcasts from the thing
          // Required to send 'data'/'schema'/'config' events to apps
          sent: [{ uuid: device.knot.router }],
        },
        message: {
          // Allow the router to send messages to the thing
          // Required to receive commands ('set_data', 'get_data', 'set_config', 'get_config')
          // from apps
          from: [{ uuid: device.knot.router }],
        },
      },
    },
  };
  if (device.type === 'gateway') {
    // Associates this thing with a gateway
    params.knot.gateways.push(device.uuid);
    // Add the user to discover and update whitelists, as the gateway was added above
    params.meshblu.whitelists.discover.view.push({ uuid: device.knot.user });
    params.meshblu.whitelists.configure.update.push({ uuid: device.knot.user });
  }
  return client.registerAsync(params);
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

async function createThingSubscriptions(deviceClient, thingClient, device, thing) {
  // Listen to messages received from the router
  // Required to receive commands from apps
  await subscribeOwn(thingClient, thing.uuid, 'message.received', thing.uuid);

  // Subscribe the router to the thing's broadcasts
  // Required to send 'data'/'schema'/'config' events
  await subscribe(deviceClient, thing.uuid, device.knot.router, 'broadcast.sent', device.uuid);
}

async function registerThing(argv) {
  const deviceClient = meshbluHttpFactory(argv, argv.credentials);
  const device = await getAuthenticatedDevice(deviceClient);
  verifyPermissions(device);

  const thing = await createThing(deviceClient, device, argv);
  const thingClient = meshbluHttpFactory(argv, thing);
  await createThingSubscriptions(deviceClient, thingClient, device, thing);

  return thing;
}

module.exports = {
  command: 'thing <id> [name]',
  desc: 'Register a thing device',
  builder: yargs => yargs
    .option('credentials', {
      alias: 'c',
      desc: 'User/gateway credentials file (JSON)',
      demandOption: true,
      coerce: loadCredentials,
    })
    .positional('id', {
      desc: 'Thing ID',
      type: 'string',
    })
    .positional('name', {
      desc: 'Thing name',
      type: 'string',
      default: 'My thing',
    }),
  handler: async (argv) => {
    /* eslint-disable no-console */
    try {
      const app = await registerThing(argv);
      console.log(JSON.stringify(app, null, 2));
    } catch (error) {
      console.error(`Failed registering thing: ${error.message}`);
    }
    /* eslint-enable no-console */
  },
};

const loadCredentials = require('../loadCredentials');
const meshbluHttpFactory = require('../factories/meshbluHttpFactory');

async function getAuthenticatedDevice(client) {
  return client.whoamiAsync();
}

function verifyPermissions(authenticatedDevice) {
  if (authenticatedDevice.type === 'thing') {
    throw new Error("Things can't list devices");
  }
}

function buildUserQuery() {
  return { $or: [{ type: 'gateway' }, { type: 'app' }, { type: 'thing' }] };
}

function buildGatewayAppQuery() {
  return { type: 'thing' };
}

function buildQuery(device/*, userQuery*/) { // eslint-disable-line spaced-comment
  // TODO: find a way to merge the userQuery with the ones generated below
  if (device.type === 'user') {
    return buildUserQuery();
  }
  return buildGatewayAppQuery();
}

function buildMetadata(device) {
  if (device.type === 'app') {
    return { as: device.knot.router };
  }
  return {};
}

async function list(client, device, userQuery) {
  const query = buildQuery(device, userQuery);
  const metadata = buildMetadata(device);
  return client.devicesAsync(query, metadata);
}

async function getDevices(argv) {
  const client = meshbluHttpFactory(argv, argv.credentials);
  const device = await getAuthenticatedDevice(client);
  verifyPermissions(device);
  return list(client, device, argv.query);
}

module.exports = {
  command: 'devices [query]',
  desc: 'List devices',
  builder: yargs => yargs
    .option('credentials', {
      alias: 'c',
      desc: 'Credentials file (JSON)',
      demandOption: true,
      coerce: loadCredentials,
    })
    .positional('query', {
      desc: 'Query to filter devices (Mongo-like query in JSON)',
      type: 'string',
      coerce: JSON.parse,
    }),
  handler: async (argv) => {
    /* eslint-disable no-console */
    try {
      const devices = await getDevices(argv);
      console.log(JSON.stringify(devices, null, 2));
    } catch (error) {
      console.error(`Failed listing devices: ${error.message}`);
    }
    /* eslint-enable no-console */
  },
};

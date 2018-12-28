const loadCredentials = require('../loadCredentials');
const meshbluHttpFactory = require('../factories/meshbluHttpFactory');

async function getAuthenticatedDevice(client) {
  return client.whoamiAsync();
}

function buildMetadata(device, uuid) {
  if (device.type === 'app' && uuid && uuid !== device.uuid) {
    return { as: device.knot.router };
  }
  return {};
}

async function create(client, device, uuid) {
  const metadata = buildMetadata(device, uuid);
  return client.generateAndStoreTokenAsync(uuid || device.uuid, metadata);
}

async function createToken(argv) {
  const client = meshbluHttpFactory(argv, argv.credentials);
  const device = await getAuthenticatedDevice(client);
  return create(client, device, argv.uuid);
}

module.exports = {
  command: 'createToken [uuid]',
  desc: 'Creates a token for a device (itself if not provided)',
  builder: yargs => yargs
    .option('credentials', {
      alias: 'c',
      desc: 'Credentials file (JSON)',
      demandOption: true,
      coerce: loadCredentials,
    })
    .positional('uuid', {
      desc: 'Device UUID to which generate a new token',
      type: 'string',
    }),
  handler: async (argv) => {
    /* eslint-disable no-console */
    try {
      const credentials = await createToken(argv);
      console.log(JSON.stringify(credentials, null, 2));
    } catch (error) {
      console.error(`Failed creating token: ${error.message}`);
    }
    /* eslint-enable no-console */
  },
};

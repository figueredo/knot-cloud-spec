const loadCredentials = require('../loadCredentials');
const meshbluHttpFactory = require('../factories/meshbluHttpFactory');

async function getAuthenticatedDevice(client) {
  return client.whoamiAsync();
}

function verifyPermissions(authenticatedDevice) {
  if (authenticatedDevice.type !== 'thing') {
    throw new Error('Only things can update config');
  }
}

async function update(client, thing, config) {
  await client.updateAsync(thing.uuid, { schema: config });
}

async function sendEvent(client, config) {
  await client.messageAsync({ devices: '*', payload: config, topic: 'config' });
}

async function updateConfig(argv) {
  const client = meshbluHttpFactory(argv, argv.credentials);
  const thing = await getAuthenticatedDevice(client);
  verifyPermissions(thing);
  // TODO: validate config against knot-protocol specs
  await update(client, thing, argv.config);
  await sendEvent(client, argv.config);
}

module.exports = {
  command: 'config <config>',
  desc: 'Update thing config on the cloud',
  builder: yargs => yargs
    .option('credentials', {
      alias: 'c',
      desc: 'Thing credentials file (JSON)',
      demandOption: true,
      coerce: loadCredentials,
    })
    .positional('config', {
      desc: 'Thing config (JSON)',
      type: 'string',
      coerce: JSON.parse,
    }),
  handler: async (argv) => {
    /* eslint-disable no-console */
    try {
      await updateConfig(argv);
      console.log(`Updated with ${JSON.stringify(argv.config, null, 2)}`);
    } catch (error) {
      console.error(`Failed updating config: ${error.message}`);
    }
    /* eslint-enable no-console */
  },
};

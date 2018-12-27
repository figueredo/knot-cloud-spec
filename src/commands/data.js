const loadCredentials = require('../loadCredentials');
const meshbluHttpFactory = require('../factories/meshbluHttpFactory');

async function getAuthenticatedDevice(client) {
  return client.whoamiAsync();
}

function verifyPermissions(authenticatedDevice) {
  if (authenticatedDevice.type !== 'thing') {
    throw new Error('Only things can send data');
  }
}

async function sendMessage(client, message) {
  await client.messageAsync({ devices: '*', payload: message, topic: 'data' });
}

async function sendData(argv) {
  const client = meshbluHttpFactory(argv, argv.credentials);
  const thing = await getAuthenticatedDevice(client);
  verifyPermissions(thing);
  // TODO: validate argv.data against thing.schema
  await sendMessage(client, argv.data);
}

module.exports = {
  command: 'data <data>',
  desc: 'Sends <data> to the cloud',
  builder: yargs => yargs
    .option('credentials', {
      alias: 'c',
      desc: 'Thing credentials file (JSON)',
      demandOption: true,
      coerce: loadCredentials,
    })
    .positional('data', {
      desc: 'Data to be sent (JSON)',
      type: 'string',
      coerce: JSON.parse,
    }),
  handler: async (argv) => {
    /* eslint-disable no-console */
    try {
      await sendData(argv);
      console.log(`Sent ${JSON.stringify(argv.data, null, 2)}`);
    } catch (error) {
      console.error(`Failed sending data: ${error.message}`);
    }
    /* eslint-enable no-console */
  },
};

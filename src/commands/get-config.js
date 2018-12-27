const loadCredentials = require('../loadCredentials');
const meshbluHttpFactory = require('../factories/meshbluHttpFactory');

async function getAuthenticatedDevice(client) {
  return client.whoamiAsync();
}

function verifyPermissions(authenticatedDevice) {
  if (authenticatedDevice.type !== 'app') {
    throw new Error("Only apps can send 'get-config'");
  }
}

async function sendMessage(client, id, as) {
  await client.messageAsync({
    devices: id,
    payload: {
      type: 'get-config',
    },
    topic: 'command',
  }, { as });
}

async function sendGetConfig(argv) {
  const client = meshbluHttpFactory(argv, argv.credentials);
  const app = await getAuthenticatedDevice(client);
  verifyPermissions(app);
  await sendMessage(client, argv.id, app.knot.router);
}

module.exports = {
  command: 'get-config <id>',
  desc: 'Requests <id> to report its configuration',
  builder: yargs => yargs
    .option('credentials', {
      alias: 'c',
      desc: 'App credentials file (JSON)',
      demandOption: true,
      coerce: loadCredentials,
    })
    .positional('id', {
      desc: 'Thing ID',
      type: 'string',
    }),
  handler: async (argv) => {
    /* eslint-disable no-console */
    try {
      await sendGetConfig(argv);
      console.log('Sent');
    } catch (error) {
      console.error(`Failed sending 'get-config': ${error.message}`);
    }
    /* eslint-enable no-console */
  },
};

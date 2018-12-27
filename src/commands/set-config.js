const loadCredentials = require('../loadCredentials');
const meshbluHttpFactory = require('../factories/meshbluHttpFactory');

async function getAuthenticatedDevice(client) {
  return client.whoamiAsync();
}

function verifyPermissions(authenticatedDevice) {
  if (authenticatedDevice.type !== 'app') {
    throw new Error("Only apps can send 'set-config'");
  }
}

async function sendMessage(client, id, config, as) {
  await client.messageAsync({
    devices: id,
    payload: {
      type: 'set-config',
      args: [config],
    },
    topic: 'command',
  }, { as });
}

async function sendSetConfig(argv) {
  const client = meshbluHttpFactory(argv, argv.credentials);
  const app = await getAuthenticatedDevice(client);
  verifyPermissions(app);
  // TODO validate argv.config
  await sendMessage(client, argv.id, argv.config, app.knot.router);
}

module.exports = {
  command: 'set-config <id> <config>',
  desc: "Updates <id>'s configuration",
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
    })
    .positional('config', {
      desc: 'Thing config (JSON)',
      type: 'string',
      coerce: JSON.parse,
    }),
  handler: async (argv) => {
    /* eslint-disable no-console */
    try {
      await sendSetConfig(argv);
      console.log('Sent');
    } catch (error) {
      console.error(`Failed sending 'set-config': ${error.message}`);
    }
    /* eslint-enable no-console */
  },
};

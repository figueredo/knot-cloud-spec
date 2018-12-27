const loadCredentials = require('../loadCredentials');
const meshbluHttpFactory = require('../factories/meshbluHttpFactory');

async function getAuthenticatedDevice(client) {
  return client.whoamiAsync();
}

function verifyPermissions(authenticatedDevice) {
  if (authenticatedDevice.type !== 'app') {
    throw new Error("Only apps can send 'get-data'");
  }
}

async function sendMessage(client, id, as) {
  await client.messageAsync({ devices: id, payload: { type: 'get-data' }, topic: 'command' }, { as });
}

async function sendGetData(argv) {
  const client = meshbluHttpFactory(argv, argv.credentials);
  const app = await getAuthenticatedDevice(client);
  verifyPermissions(app);
  await sendMessage(client, argv.id, app.knot.router);
}

module.exports = {
  command: 'get-data <id>',
  desc: 'Requests <id> to report its data',
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
      await sendGetData(argv);
      console.log('Sent');
    } catch (error) {
      console.error(`Failed sending 'get-data': ${error.message}`);
    }
    /* eslint-enable no-console */
  },
};

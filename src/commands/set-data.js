const loadCredentials = require('../loadCredentials');
const meshbluHttpFactory = require('../factories/meshbluHttpFactory');

async function getAuthenticatedDevice(client) {
  return client.whoamiAsync();
}

function verifyPermissions(authenticatedDevice) {
  if (authenticatedDevice.type !== 'app') {
    throw new Error("Only apps can send 'set-data'");
  }
}

async function sendMessage(client, id, sensorId, value, as) {
  await client.messageAsync({
    devices: id,
    payload: {
      type: 'set-data',
      args: [sensorId, value],
    },
    topic: 'command',
  }, { as });
}

async function sendSetData(argv) {
  const client = meshbluHttpFactory(argv, argv.credentials);
  const app = await getAuthenticatedDevice(client);
  verifyPermissions(app);
  // TODO: validate sensorId and value against thing's schema
  await sendMessage(client, argv.id, argv.sensorId, argv.value, app.knot.router);
}

module.exports = {
  command: 'set-data <id> <sensor-id> <value>',
  desc: "Updates <id>'s sensor",
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
    .positional('sensor-id', {
      desc: 'Sensor ID',
      type: 'number',
    })
    .positional('value', {
      desc: 'Sensor value',
      type: 'string',
    }),
  handler: async (argv) => {
    /* eslint-disable no-console */
    try {
      await sendSetData(argv);
      console.log('Sent');
    } catch (error) {
      console.error(`Failed sending 'set-data': ${error.message}`);
    }
    /* eslint-enable no-console */
  },
};

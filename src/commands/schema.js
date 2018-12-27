const loadCredentials = require('../loadCredentials');
const meshbluHttpFactory = require('../factories/meshbluHttpFactory');

async function getAuthenticatedDevice(client) {
  return client.whoamiAsync();
}

function verifyPermissions(authenticatedDevice) {
  if (authenticatedDevice.type !== 'thing') {
    throw new Error('Only things can update schema');
  }
}

async function update(client, thing, schema) {
  await client.updateAsync(thing.uuid, { schema });
}

async function sendEvent(client, schema) {
  await client.messageAsync({ devices: '*', payload: schema, topic: 'schema' });
}

async function updateSchema(argv) {
  const client = meshbluHttpFactory(argv, argv.credentials);
  const thing = await getAuthenticatedDevice(client);
  verifyPermissions(thing);
  // TODO: validate schema against knot-protocol specs
  await update(client, thing, argv.schema);
  await sendEvent(client, argv.schema);
}

module.exports = {
  command: 'schema <schema>',
  desc: 'Update thing schema',
  builder: yargs => yargs
    .option('credentials', {
      alias: 'c',
      desc: 'Thing credentials file (JSON)',
      demandOption: true,
      coerce: loadCredentials,
    })
    .positional('schema', {
      desc: 'Thing schema (JSON)',
      type: 'string',
      coerce: JSON.parse,
    }),
  handler: async (argv) => {
    /* eslint-disable no-console */
    try {
      await updateSchema(argv);
      console.log(`Updated with ${JSON.stringify(argv.schema, null, 2)}`);
    } catch (error) {
      console.error(`Failed updating schema: ${error.message}`);
    }
    /* eslint-enable no-console */
  },
};

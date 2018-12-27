const _ = require('lodash');
const loadCredentials = require('../loadCredentials');
const meshbluFirehoseFactory = require('../factories/meshbluFirehoseFactory');

function toEvent(message) {
  return {
    from: _.chain(message.metadata.route)
      .filter({ type: 'broadcast.sent' })
      .map('from')
      .head()
      .value(), // TODO: translate to KNoT ID
    type: message.data.topic,
    data: message.data.payload,
  };
}

function listen(client) {
  client.on('message', (message) => {
    const event = toEvent(message);
    console.log(JSON.stringify(event, null, 2)); // eslint-disable-line no-console
  });
  client.connect();
}

async function on(argv) {
  const firehoseClient = meshbluFirehoseFactory(argv, argv.credentials);
  listen(firehoseClient);
}

module.exports = {
  command: 'on',
  desc: 'Listen to events',
  builder: yargs => yargs
    .option('credentials', {
      alias: 'c',
      desc: 'App/thing credentials file (JSON)',
      demandOption: true,
      coerce: loadCredentials,
    }),
  handler: async (argv) => {
    try {
      await on(argv);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed listening to device events: ${error.message}`);
    }
  },
};

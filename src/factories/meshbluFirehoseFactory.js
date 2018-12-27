const MeshbluFirehose = require('meshblu-firehose-socket.io');

module.exports = (configuration, credentials) => new MeshbluFirehose({
  meshbluConfig: {
    hostname: configuration.firehoseHostname,
    port: configuration.firehosePort,
    protocol: configuration.firehoseSecure ? 'wss' : 'ws',
    uuid: credentials ? credentials.uuid : undefined,
    token: credentials ? credentials.token : undefined,
  },
});

const MeshbluHttp = require('meshblu-http');
const { promisifyAll } = require('bluebird');

module.exports = (configuration, credentials) => (promisifyAll(
  new MeshbluHttp({
    hostname: configuration.httpHostname,
    port: configuration.httpPort,
    protocol: configuration.httpSecure ? 'https' : 'http',
    uuid: credentials ? credentials.uuid : undefined,
    token: credentials ? credentials.token : undefined,
  }),
));

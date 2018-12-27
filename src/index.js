// eslint-disable-next-line no-unused-expressions
require('yargs')
  .usage('$0 <cmd> [args]')
  .option('http-hostname', {
    alias: 'H',
    describe: 'HTTP adapter hostname',
    type: 'string',
    demandOption: true,
    default: 'localhost',
  })
  .option('http-port', {
    alias: 'p',
    describe: 'HTTP adapter port',
    type: 'number',
    demandOption: true,
    default: 3000,
  })
  .option('http-secure', {
    alias: 's',
    describe: 'Use HTTPS',
    type: 'boolean',
    demandOption: true,
    default: false,
  })
  .option('firehose-hostname', {
    alias: 'F',
    describe: 'Firehose hostname',
    type: 'string',
    demandOption: true,
    default: 'localhost',
  })
  .option('firehose-port', {
    alias: 'P',
    describe: 'Firehose port',
    type: 'number',
    demandOption: true,
    default: 3080,
  })
  .option('firehose-secure', {
    alias: 'S',
    describe: 'Use secure WebSockets',
    type: 'boolean',
    demandOption: true,
    default: false,
  })
  .commandDir('commands')
  .demandCommand()
  .strict()
  .alias('h', 'help')
  .help()
  .argv;

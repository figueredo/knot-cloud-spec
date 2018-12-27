module.exports = {
  command: 'register <type>',
  desc: 'Register a device of <type>',
  builder: yargs => yargs.commandDir('./register'),
  handler: () => {},
};

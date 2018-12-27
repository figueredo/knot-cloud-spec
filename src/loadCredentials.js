const fs = require('fs');
const _ = require('lodash');

module.exports = (file) => {
  const credentials = JSON.parse(fs.readFileSync(file, 'utf8'));
  return _.pick(credentials, 'uuid', 'token');
};

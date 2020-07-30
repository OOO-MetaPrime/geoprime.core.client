const config = require('../../../server/src/config')

module.exports = {
  NODE_ENV: '"production"',
  BASE: `"${config.base}"`
}

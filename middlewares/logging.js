const _ = require('lodash')
const logger = require('winston')
const morgan = require('morgan')

/**
 * HTTP logging middleware
 */
module.exports = morgan(':method :url :status [:remote-addr] - :response-time ms', {
  stream: {
    write: (message) => logger.log('info', _.trim(message))
  }
})

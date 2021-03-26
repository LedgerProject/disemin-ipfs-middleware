const _ = require('lodash')
const error = require('http-errors')
const logger = require('winston')

/**
 * Express middleware that validates Chainlink external adapter request.
 * Read more: https://docs.chain.link/docs/developers
 */
function validator () {
  return (req, res, next) => {
    if (_.isNil(req.body.id)) return next(error(400, `Required parameter 'id' is missing`))
    if (_.isNil(req.body.data)) return next(error(400, `Required parameter 'data' is missing`))
    next()
  }
}

/**
 * Success response middleware
 */
function onSuccess (data, req, res) {
  logger.log('debug', `Returning success for data ${JSON.stringify(data)}`)
  return res.status(200).send({
    jobRunID: req.body.id,
    data: data
  })
}

/**
 * Success response wrapper
 */
function onError (err, req, res) {
  logger.log('debug', `Returning error: ${err.message}`)
  return res.status(err.status || 500).send({
    jobRunID: req.body.id,
    data: {},
    status: 'errored',
    error: err.message
  })
}

module.exports = { validator, onSuccess, onError }

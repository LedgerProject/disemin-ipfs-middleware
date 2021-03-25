const _ = require('lodash')
const error = require('http-errors')

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

module.exports = { validator }

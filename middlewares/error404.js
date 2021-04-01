/**
 * Middleware that propagates the request to the error handler with a 404 NOT FOUND error.
 * Add at last - 1 position of the express middlewares, right before the global error handler.
 */
const error = require('http-errors')
module.exports = function () {
  return (req, res, next) => next(error(404, 'Not found'))
}

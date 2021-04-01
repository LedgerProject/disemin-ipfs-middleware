const logger = require('winston')
/**
 * Middleware handles all errors from previous middlewares/routers that end up here.
 * Add at last position of the express middlewares.
 */
module.exports = function () {
  return function (err, req, res, next) {
    const status = err.status || 500

    // Log internal errors
    if (status >= 500) {
      logger.log('warning', err.stack)
    }

    // Delegate to the default Express error handler, if headers have already been sent
    if (res.headersSent) {
      return next(err)
    }

    // Send error response
    res.status(status).send({
      error: err.message,
      message: `Could not ${req.method} ${req.path}`
    })
  }
}

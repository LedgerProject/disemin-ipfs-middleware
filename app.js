const _ = require('lodash')
const error = require('http-errors')
const express = require('express')
const helmet = require('helmet')
const logger = require('winston')
const morgan = require('morgan')

// Configure server
const app = express()

// Add basic security with HTTP headers
app.use(helmet())

// Http logger
app.use(morgan(':method :url :status [:remote-addr] - :response-time ms', {
  stream: {
    write: (message) => logger.log('info', _.trim(message))
  }
}))

// Add API documentation router
app.use('/', require('./controller'))

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(error(404, 'Not found'))
})

// Global error handler
app.use(function (err, req, res, next) {
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
})

// Start server
const host = process.env.HOST || '127.0.0.1'
const port = process.env.PORT || 3001
app.listen(port, host, function () {
  logger.log('info', `Server listening on http://${host}:${port}`)
})

module.exports = app

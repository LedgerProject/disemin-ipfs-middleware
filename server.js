const express = require('express')
const helmet = require('helmet')
const logger = require('winston')
const middlewares = require('./middlewares')

// Configure server
const server = express()

// Add basic security with HTTP headers
server.use(helmet())

// Http logger
server.use(middlewares.logging)

// Add API router
server.use('/', require('./api'))

// Catch 404 and forward to error handler
server.use(middlewares.error404())

// Global error handler
server.use(middlewares.errorElse())

// Start server
const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 3001
server.listen(port, host, function () {
  logger.log('info', `Server listening on http://${host}:${port}`)
})

module.exports = server

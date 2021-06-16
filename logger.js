'use strict'

const winston = require('winston')
const { format } = winston

const formatter = ({ level, message, timestamp, stack }) => {
  if (stack) {
    return `${timestamp} ${level}: ${message} - ${stack}`
  } else {
    return `${timestamp} ${level}: ${message}`
  }
}

// Configure global logger defaults
winston.configure({
  levels: winston.config.syslog.levels,
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.colorize({ all: true }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.printf(formatter)
  ),
  transports: [
    new winston.transports.Console()
  ]
})

module.exports = winston

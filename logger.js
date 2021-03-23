const winston = require('winston')
const { format } = winston

// Configure global logger defaults
winston.configure({
  levels: winston.config.syslog.levels,
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console()
  ]
})

module.exports = winston

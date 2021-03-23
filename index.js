// Load environment variables from .env file
require('dotenv').config()

// Configure global logger
require('./logger')

// Start app server
require('./app')

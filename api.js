const compression = require('compression')
const controllers = require('./controllers')
const express = require('express')

// Create router
const router = express.Router()

// Misc middleware
router.use(compression())
router.use(express.json())

// Handle IPFS hash requests
router.use('/ipfs', controllers.ipfs)

// Handle PNS requests
router.use('/ipns', controllers.ipns)

// Handle Weather data requests
router.use('/weather', controllers.weather)

// Handle Chainlink data requests
router.use('/chainlink', controllers.chainlink)

module.exports = router

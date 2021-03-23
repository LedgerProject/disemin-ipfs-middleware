const compression = require('compression')
const express = require('express')
const logger = require('winston')
const ipfs = require('./ipfs')
const timeout = require('connect-timeout')

// Create router
const router = express.Router()

// Misc middleware
router.use(compression())
router.use(express.json())
router.use(express.urlencoded({ extended: false }))

// Add middleware for request timeout after 10 minutes (IPNS operations take loooong time)
router.use(timeout('600s'), (req, res, next) => {
  if (!req.timedout) next()
})

// Handle IPFS hash requests
router.use('/ipfs/:hash', (req, res, next) => {
  let hash = req.params.hash
  logger.log('info', `Received hash ${hash}`)
  ipfs.hashToPath(hash)
    .then(data => res.status(200).send(data))
    .catch(err => next(err))
})

module.exports = router

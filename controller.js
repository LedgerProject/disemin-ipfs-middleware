const _ = require('lodash')
const chainlink = require('./chainlink')
const compression = require('compression')
const error = require('http-errors')
const express = require('express')
const logger = require('winston')
const ipfs = require('./ipfs')
const queue = require('./queue')
const timeout = require('connect-timeout')

// Create router
const router = express.Router()

// Misc middleware
router.use(compression())
router.use(express.json())

// Add middleware for request timeout after 10 minutes (IPNS operations take loooong time)
router.use(timeout('600s'), (req, res, next) => {
  if (!req.timedout) next()
})

// Handle IPFS hash requests
router.use('/ipfs', require('./ipfs-controller'))

// Handle PNS requests
router.use('/ipns', require('./ipns-controller'))

// Handle IPFS hash requests
router.get('/weather/:geohash/latest', (req, res, next) => {
  let geohash = req.params.geohash
  logger.log('info', `Getting latest for ${geohash}`)
  return ipfs.getLatest(geohash)
    .then(data => res.json(data))
    .catch(err => {
      logger.log('error', `Failed to get latest for ${geohash}`, err)
      next(error(500, err.message))
    })
})

// Handle Chainlink data requests
router.post('/chainlink', chainlink.validator(), (req, res, next) => {
  let geohash = _.get(req, 'body.data.geohash')

  if (_.isNil(geohash)) {
    return chainlink.onError(error(400, `Required param 'data.geohash' is missing`), req, res)
  }

  return ipfs.getLatest(geohash)
    .then(data => chainlink.onSuccess(data, req, res))
    .catch(err => chainlink.onError(err, req, res))
})

module.exports = router

const _ = require('lodash')
const chainlink = require('./chainlink')
const compression = require('compression')
const error = require('http-errors')
const express = require('express')
const logger = require('winston')
const moment = require('moment')
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
router.post('/ipfs/:hash', (req, res, next) => {
  let hash = req.params.hash

  logger.log('info', `Received hash ${hash}`)

  // Return error if hash is not valid
  if (!ipfs.isValid(hash)) {
    return next(error(400, 'Invalid IPFS hash. Must be exactly 46 bt'))
  }

  // Get data from IPFS
  ipfs.getTelemetryData(hash)
    .then(data => {
      let geohash = _.get(data, 'values.geohash')

      if (_.isNil(geohash)) {
        throw error(400, `Required 'geohash' parameter is missing from the telemetry payload`)
      }

      // Create filename from telemetry data
      let filename = `/${geohash}/${moment(data.ts).format('YYYYMMDD_HHmmssSSS')}.json`

      logger.log('info', `Copying ${hash} to ${filename}`)

      // Copy data to MFS
      return ipfs.copy(hash, filename)
    })
    .then(() => {
      logger.log('info', 'Publishing updated root folder hash to IPNS')
      queue.queue.push(hash)
      return res.status(200).end()
    })
    .catch(err => {
      logger.log('error', `Failed to process hash ${hash}`, err)
      next(error(err.status || 500, err.message))
    })
})

// Update root hash on IPNS
router.post('/ipns/update', (req, res, next) => {
  queue.queue.push()
  return res.status(200).end()
})

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

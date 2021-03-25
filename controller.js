const _ = require('lodash')
const compression = require('compression')
const error = require('http-errors')
const express = require('express')
const logger = require('winston')
const moment = require('moment')
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
      // Create filename from telemetry data
      let filename = `/${data.geohash}/${moment(data.ts).format('YYYYMMDD_HHmmssSSS')}.json`

      logger.log('info', `Copying ${hash} to ${filename}`)

      // Copy data to MFS
      return ipfs.copy(hash, filename)
    })
    .then(() => {
      logger.log('info', 'Publishing updated root folder hash to IPNS')
      return ipfs.update()
    })
    .then(published => res.json(published))
    .catch(err => {
      logger.log('error', `Failed to process hash ${hash}`, err)
      next(error(500, err.message))
    })
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

module.exports = router

const _ = require('lodash')
const error = require('http-errors')
const express = require('express')
const logger = require('winston')
const moment = require('moment')
const ipfs = require('./ipfs')
const queue = require('./queue')

// Create router
const router = express.Router()

// Middleware for validating IPFS hashes
router.use('/:hash', (req, res, next) => {
  let hash = req.params.hash
  logger.log('info', `Received hash ${hash}`)

  // Return error if hash is not valid
  if (!ipfs.isValid(hash)) {
    return next(error(400, 'Invalid IPFS hash. Must be exactly 46 bt'))
  } else {
    return next()
  }
})

/**
 * Resolves the hashed IPFS CID and returns its contents as telemetry data.
 */
router.get('/:hash', (req, res, next) => {
  // Get data from IPFS
  ipfs.getData(req.params.hash)
    .then(data => res.json(data))
})

/**
 * Resolves the hashed IPFS CID and performs the necessary file organizing operations.
 * Returns after all operations are complete, except for the IPNS publishing that is
 * slow and is performed in the background, after the method has returned.
 */
router.post('/:hash', (req, res, next) => {
  let hash = req.params.hash
  // Get data from IPFS as telemetry
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

module.exports = router

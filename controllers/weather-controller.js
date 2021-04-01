const error = require('http-errors')
const express = require('express')
const ipfs = require('../ipfs')
const logger = require('winston')

// Create router
const router = express.Router()

/**
 * Return the latest weather telemetry for the geohash
 */
router.get('/:geohash/latest', (req, res, next) => {
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

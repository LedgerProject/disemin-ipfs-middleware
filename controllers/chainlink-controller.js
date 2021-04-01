const _ = require('lodash')
const chainlink = require('../chainlink')
const error = require('http-errors')
const express = require('express')
const ipfs = require('../ipfs')

// Create router
const router = express.Router()

/**
 * Handle Chainlink adapter POST requests.
 */
router.post('/', chainlink.validator(), (req, res, next) => {
  let geohash = _.get(req, 'body.data.geohash')

  if (_.isNil(geohash)) {
    return chainlink.onError(error(400, `Required param 'data.geohash' is missing`), req, res)
  }

  return ipfs.getLatest(geohash)
    .then(data => chainlink.onSuccess(data, req, res))
    .catch(err => chainlink.onError(err, req, res))
})

module.exports = router
